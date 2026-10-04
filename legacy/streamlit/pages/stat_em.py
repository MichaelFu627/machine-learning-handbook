import streamlit as st
import numpy as np
import plotly.graph_objs as go
import time
from scipy.stats import multivariate_normal, poisson

st.set_page_config(page_title="EM 算法深度解析", page_icon="🔄", layout="wide")

st.markdown("# 🔄 EM 算法：从原理到动态推演")

# ==============================================================================
# 1. 侧边栏：配置
# ==============================================================================
st.sidebar.header("🎛️ 实验配置")

# 1.1 分布模型
dist_type = st.sidebar.selectbox(
    "选择概率模型",
    ["高斯混合模型 (GMM)", "泊松混合模型 (Poisson Mixture)"],
    help="GMM 用于连续聚类，Poisson Mixture 用于计数数据聚类"
)

# 1.2 参数
n_clusters = st.sidebar.slider("隐变量维度 (簇数 K)", 2, 4, 2)
n_samples = st.sidebar.slider("观测样本量 (N)", 100, 800, 300)

if dist_type.startswith("高斯"):
    cluster_std = st.sidebar.slider("簇标准差 (重叠度)", 0.5, 2.0, 1.0)
    # Data Gen
    np.random.seed(42)
    true_means = np.random.uniform(0, 10, (n_clusters, 2))
    true_covs = [np.eye(2) * cluster_std**2 for _ in range(n_clusters)]
    X_list = []
    for k in range(n_clusters):
        X_k = np.random.multivariate_normal(true_means[k], true_covs[k], n_samples // n_clusters + (k < n_samples % n_clusters))
        X_list.append(X_k)
    X = np.vstack(X_list)
else:
    lambda_spacing = st.sidebar.slider("Lambda 间隔", 2.0, 10.0, 5.0)
    # Data Gen
    np.random.seed(42)
    true_lambdas = np.arange(1, n_clusters + 1) * lambda_spacing + 2
    X_list = []
    for k in range(n_clusters):
        X_k = np.random.poisson(lam=true_lambdas[k], size=n_samples // n_clusters + (k < n_samples % n_clusters))
        X_list.append(X_k)
    X = np.concatenate(X_list)

# ==============================================================================
# 2. 算法类定义 (保持逻辑不变，用于计算)
# ==============================================================================
from ml_handbook.algorithms import GMM_EM, Poisson_EM

# ==============================================================================
# 3. 页面布局：数学推导 vs 可视化
# ==============================================================================
col_math, col_viz = st.columns([5, 5])

# ------------------------------------------------------------------------------
# 左侧：动态数学推导 (根据分布类型变化)
# ------------------------------------------------------------------------------
with col_math:
    st.subheader("📐 数学原理深度拆解")
    
    # --- 1. 问题设定 ---
    st.info("Step 1: 问题设定 (Problem Setup)")
    st.markdown(r"我们观测到一组数据 $X = \{x_1, \dots, x_N\}$。我们假设这些数据是由 $K$ 个不同的分布混合生成的。")
    if dist_type.startswith("高斯"):
        st.markdown("**模型假设：** 数据服从高斯混合分布。")
        st.latex(r"x_i \sim \sum_{k=1}^K \pi_k \mathcal{N}(x_i | \mu_k, \Sigma_k)")
        st.markdown(r"我们想求出参数 $\theta = \{\pi_k, \mu_k, \Sigma_k\}$。")
    else:
        st.markdown("**模型假设：** 数据服从泊松混合分布。")
        st.latex(r"x_i \sim \sum_{k=1}^K \pi_k \text{Poisson}(x_i | \lambda_k)")
        st.markdown(r"我们想求出参数 $\theta = \{\pi_k, \lambda_k\}$。")

    st.markdown("---")

    # --- 2. 隐变量 ---
    st.info("Step 2: 引入隐变量 (Latent Variables)")
    st.markdown("直接求解很难，因为我们不知道每个 $x_i$ 到底属于哪个簇。")
    st.markdown(r"我们引入隐变量 $Z = \{z_{i1}, \dots, z_{iK}\}$，其中：")
    st.latex(r"z_{ik} = \begin{cases} 1 & \text{若 } x_i \text{ 属于第 } k \text{ 类} \\ 0 & \text{其他} \end{cases}")
    
    st.markdown("---")

    # --- 3. 对数似然对比 ---
    st.info("Step 3: 观测似然 vs 完全似然")
    
    tab1, tab2 = st.tabs(["观测数据 Log-Likelihood (难)", "完全数据 Log-Likelihood (易)"])
    
    with tab1:
        st.error("❌ **Observed Data Log-Likelihood:**")
        st.markdown(r"这是我们真正想最大化的，但求和符号 $\sum$ 在对数 $\ln$ 里面，导致导数极其复杂，无法求解析解。")
        if dist_type.startswith("高斯"):
            st.latex(r"\ell_{obs}(\theta) = \sum_{i=1}^N \ln \left( \sum_{k=1}^K \pi_k \mathcal{N}(x_i | \mu_k, \Sigma_k) \right)")
        else:
            st.latex(r"\ell_{obs}(\theta) = \sum_{i=1}^N \ln \left( \sum_{k=1}^K \pi_k \frac{\lambda_k^{x_i} e^{-\lambda_k}}{x_i!} \right)")

    with tab2:
        st.success("✅ **Complete Data Log-Likelihood:**")
        st.markdown("如果我们知道隐变量 $Z$，问题就变成了简单的**加权最大似然估计**。求和符号跑到了对数外面！")
        if dist_type.startswith("高斯"):
            st.latex(r"\ell_{comp}(\theta) = \sum_{i=1}^N \sum_{k=1}^K z_{ik} \left[ \ln \pi_k + \ln \mathcal{N}(x_i | \mu_k, \Sigma_k) \right]")
        else:
            st.latex(r"\ell_{comp}(\theta) = \sum_{i=1}^N \sum_{k=1}^K z_{ik} \left[ \ln \pi_k + x_i \ln \lambda_k - \lambda_k - \ln(x_i!) \right]")

    st.markdown("---")

    # --- 4. 迭代步骤 ---
    st.info("Step 4: EM 迭代解法")
    st.markdown(r"EM 算法通过不断计算 $z_{ik}$ 的期望（E步）并最大化 $\ell_{comp}$（M步）来逼近最优解。")
    
    st.markdown("**👉 E-Step (期望步):**")
    st.markdown(r"基于当前参数，猜测 $x_i$ 属于第 $k$ 类的概率 (Posterior Responsibility) $\gamma_{ik} = E[z_{ik}]$。")
    if dist_type.startswith("高斯"):
        st.latex(r"\gamma_{ik} = \frac{\pi_k \mathcal{N}(x_i | \mu_k, \Sigma_k)}{\sum_j \pi_j \mathcal{N}(x_i | \mu_j, \Sigma_j)}")
    else:
        st.latex(r"\gamma_{ik} = \frac{\pi_k \text{Pois}(x_i | \lambda_k)}{\sum_j \pi_j \text{Pois}(x_i | \lambda_j)}")

    st.markdown("**👉 M-Step (最大化步):**")
    st.markdown(r"利用 $\gamma_{ik}$ 作为权重，更新参数。")
    
    if dist_type.startswith("高斯"):
        st.markdown("高斯分布的 MLE 是均值，所以加权更新：")
        st.latex(r"\mu_k^{new} = \frac{\sum_i \gamma_{ik} x_i}{\sum_i \gamma_{ik}}")
        st.markdown("协方差矩阵同理更新。")
    else:
        st.markdown("泊松分布的 MLE 也是均值，所以加权更新：")
        st.latex(r"\lambda_k^{new} = \frac{\sum_i \gamma_{ik} x_i}{\sum_i \gamma_{ik}}")

# ------------------------------------------------------------------------------
# 右侧：可视化动画
# ------------------------------------------------------------------------------
with col_viz:
    st.subheader("🎬 迭代过程可视化")
    
    start_btn = st.button("▶️ 运行 EM 算法", type="primary", use_container_width=True)
    chart_area = st.empty()
    
    # 初始空图
    if not start_btn:
        fig = go.Figure()
        if dist_type.startswith("高斯"):
            fig.add_trace(go.Scatter(x=X[:,0], y=X[:,1], mode='markers', marker=dict(color='lightgray'), name='Data'))
            fig.update_layout(title="Ready to Run", xaxis_title="X1", yaxis_title="X2", height=600)
        else:
            fig.add_trace(go.Histogram(x=X, marker_color='lightgray', name='Data'))
            fig.update_layout(title="Ready to Run", xaxis_title="Count", yaxis_title="Freq", height=600)
        chart_area.plotly_chart(fig, use_container_width=True)

    if start_btn:
        # Initialize Model
        if dist_type.startswith("高斯"):
            model = GMM_EM(X, n_clusters)
        else:
            model = Poisson_EM(X, n_clusters)
            
        colors = ['#FF4136', '#0074D9', '#2ECC40', '#FF851B'] # Red, Blue, Green, Orange
        
        # Iteration Loop
        for step in range(20):
            gamma = model.step()
            
            fig = go.Figure()
            
            # --- Visualizing GMM ---
            if dist_type.startswith("高斯"):
                # 1. Data colored by responsibility
                labels = np.argmax(gamma, axis=1)
                fig.add_trace(go.Scatter(
                    x=X[:,0], y=X[:,1], mode='markers',
                    marker=dict(color=labels, colorscale='Viridis', size=6, opacity=0.6),
                    name='Data'
                ))
                
                # 2. Gaussian Contours & Means
                x_range = np.linspace(X[:,0].min()-2, X[:,0].max()+2, 50)
                y_range = np.linspace(X[:,1].min()-2, X[:,1].max()+2, 50)
                xx, yy = np.meshgrid(x_range, y_range)
                pos = np.dstack((xx, yy))
                
                for k in range(n_clusters):
                    # Current Mean
                    fig.add_trace(go.Scatter(
                        x=[model.mu[k,0]], y=[model.mu[k,1]], mode='markers',
                        marker=dict(symbol='x', size=15, color='black'), showlegend=False
                    ))
                    # Trajectory
                    mu_hist = np.array(model.history_mu)
                    fig.add_trace(go.Scatter(
                        x=mu_hist[:,k,0], y=mu_hist[:,k,1], mode='lines',
                        line=dict(color=colors[k%4], dash='dot'), name=f'Cluster {k+1}'
                    ))
                    # Contour
                    z = multivariate_normal.pdf(pos, mean=model.mu[k], cov=model.covs[k])
                    fig.add_trace(go.Contour(
                        x=x_range, y=y_range, z=z,
                        colorscale=[[0, 'rgba(0,0,0,0)'], [1, colors[k%4]]],
                        opacity=0.3, showscale=False, contours=dict(coloring='lines'), showlegend=False
                    ))

                fig.update_layout(title=f"GMM Iteration: {step+1}", height=600)
            
            # --- Visualizing Poisson ---
            else:
                # 1. Histogram
                fig.add_trace(go.Histogram(
                    x=X, histnorm='probability', marker_color='lightgray', name='Data'
                ))
                
                # 2. Poisson Lines
                x_vals = np.arange(0, X.max()+5)
                total_pdf = np.zeros_like(x_vals, dtype=float)
                
                for k in range(n_clusters):
                    pmf = poisson.pmf(x_vals, mu=model.lambdas[k]) * model.pi[k]
                    total_pdf += pmf
                    fig.add_trace(go.Scatter(
                        x=x_vals, y=pmf, mode='lines',
                        line=dict(color=colors[k%4], dash='dot'),
                        name=f'Component {k+1} (λ={model.lambdas[k]:.1f})'
                    ))
                
                # Total fit
                fig.add_trace(go.Scatter(
                    x=x_vals, y=total_pdf, mode='lines',
                    line=dict(color='black', width=3), name='Mixture Model'
                ))
                
                fig.update_layout(title=f"Poisson Iteration: {step+1}", height=600)

            chart_area.plotly_chart(fig, use_container_width=True)
            time.sleep(0.5)