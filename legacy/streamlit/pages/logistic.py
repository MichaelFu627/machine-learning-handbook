import streamlit as st
import numpy as np
import pandas as pd
import plotly.graph_objs as go
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification
from sklearn.metrics import accuracy_score
from scipy.special import expit # Sigmoid function

st.set_page_config(page_title="逻辑回归深度解析", page_icon="📉", layout="wide")

st.markdown("# 📉 逻辑回归 (Logistic Regression)")
st.markdown("虽然名字里有“回归”，但它是一个用于**二分类**的线性模型。它是广义线性模型 (GLM) 的典型代表。")

# --- Sidebar: 参数控制 ---
st.sidebar.header("🎛️ 实验参数")
n_samples = st.sidebar.slider("样本数量", 50, 500, 200)
noise_idx = st.sidebar.slider("数据噪声/重叠度", 0.0, 1.0, 0.2, help="值越大，两类数据重叠越多，越难分类")
C_param = st.sidebar.slider("逆正则化强度 C", 0.01, 10.0, 1.0, help="C越小正则化越强（防止过拟合），C越大越拟合训练数据")

# --- Data Generation ---
# 生成带噪声的二分类数据
X, y = make_classification(
    n_samples=n_samples, 
    n_features=2, 
    n_informative=2, 
    n_redundant=0, 
    n_clusters_per_class=1, 
    flip_y=0.01, # 少量随机翻转标签增加难度
    class_sep=2.0 - noise_idx, # 根据噪声参数调整分离度
    random_state=42
)

# --- Model Training ---
clf = LogisticRegression(C=C_param, solver='lbfgs')
clf.fit(X, y)
st.caption("下方推导为无正则似然；实际模型还包含 L2 正则化。当前指标为训练集指标，不能代表泛化表现。")

# 提取参数
w = clf.coef_[0]
b = clf.intercept_[0]
y_pred = clf.predict(X)
error_rate = 1 - accuracy_score(y, y_pred)

# --- Layout ---
col_math, col_viz = st.columns([4, 6])

# ==============================================================================
# 左侧：严谨的数学推导
# ==============================================================================
with col_math:
    st.subheader("📐 数学原理推导")
    
    # 1. 模型假设
    st.markdown("### 1. 概率分布假设")
    st.markdown("逻辑回归假设因变量 $Y$ 服从 **伯努利分布 (Bernoulli Distribution)**：")
    st.latex(r"Y|X \sim \text{Bernoulli}(p)")
    st.latex(r"P(Y=1|X) = p, \quad P(Y=0|X) = 1-p")

    st.markdown("---")
    
    # 2. 链接函数与 Sigmoid
    st.markdown("### 2. Log-Odds 与 Sigmoid 等价性")
    st.markdown(r"为了利用线性模型 $\beta^T x + b$ 来预测概率 $p$，我们使用 **Logit 链接函数**。我们将“对数几率 (Log Odds)”建模为线性方程：")
    st.latex(r"\log\left(\frac{p}{1-p}\right) = \beta^T x + b")
    
    st.markdown(r"对上式求逆，解出 $\phi$，即可得到著名的 **Sigmoid 函数**：")
    st.latex(r"p(\eta) = \sigma(\eta) = \frac{1}{1 + e^{-\eta}}")
    st.markdown(r"其中 $\eta = \beta^T x + b$ 被称为线性得分 (Linear Score)。")

    st.markdown("---")

    # 3. 极大似然估计
    st.markdown("### 3. Parameter Estimation (MLE)")
    st.markdown("由于不是最小二乘法，我们使用**极大似然估计**。似然函数为：")
    st.latex(r"L(\beta) = \prod_{i=1}^N p(x_i)^{y_i} (1-p(x_i))^{1-y_i}")
    
    st.markdown("取对数得到 **对数似然函数 (Log-Likelihood)**：")
    st.latex(r"\ell(w) = \sum_{i=1}^N [y_i \ln(p_i) + (1-y_i) \ln(1-p_i)]")
    
    st.markdown("---")
    
    # 4. 优化算法
    st.markdown("### 4. 为什么需要迭代算法？")
    st.markdown(r"为了求最优解，我们将 $\nabla \ell(\beta)$ 设为 0。")
    st.error(r"⚠️ **关键点：** 此时得到的方程包含非线性的 $e^{-\beta^T x}$，**没有闭式解 (No Closed-form Solution)**。")
    st.markdown("因此，我们必须使用数值优化算法来迭代求解，例如：")
    st.markdown("* 梯度下降法 (Gradient Descent)")
    st.markdown("* 牛顿-拉夫逊法 (Newton-Raphson) / IRLS")
    
    st.markdown("---")

    # 5. 决策边界
    st.markdown("### 5. 线性决策边界")
    st.markdown("当我们设定阈值为 0.5 时，决策边界即为 $P(Y=1) = 0.5$ 的位置：")
    st.latex(r"\frac{1}{1 + e^{-(\beta^T x + b)}} = 0.5 \implies e^{-(\beta^T x + b)} = 1")
    st.markdown("两边取对数，得到一个**线性方程**：")
    st.latex(r"\beta^T x + b = 0")

# ==============================================================================
# 右侧：可视化
# ==============================================================================
with col_viz:
    st.subheader("📊 模型表现与可视化")
    
    # 显示指标
    m1, m2 = st.columns(2)
    m1.metric("训练分类错误率 (Training Error)", f"{error_rate:.2%}", delta_color="inverse")
    m2.metric("训练准确率 (Training Accuracy)", f"{1-error_rate:.2%}")

    viz_tabs = st.tabs(["🖼️ 2D 线性决策边界", "📈 经验 Sigmoid 曲线"])

    # --- Tab 1: 2D 决策边界 ---
    with viz_tabs[0]:
        # 1. 绘制等高线背景
        x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
        y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1
        xx, yy = np.meshgrid(np.linspace(x_min, x_max, 200), np.linspace(y_min, y_max, 200))
        
        # 计算网格上每个点的概率
        Z = clf.predict_proba(np.c_[xx.ravel(), yy.ravel()])[:, 1]
        Z = Z.reshape(xx.shape)
        
        fig_bound = go.Figure()
        
        # 概率热力图
        fig_bound.add_trace(go.Contour(
            z=Z, x=np.linspace(x_min, x_max, 200), y=np.linspace(y_min, y_max, 200),
            colorscale='RdBu', opacity=0.4, showscale=True,
            name='P(y=1)'
        ))
        
        # 决策边界线 (P=0.5)
        fig_bound.add_trace(go.Contour(
            z=Z, x=np.linspace(x_min, x_max, 200), y=np.linspace(y_min, y_max, 200),
            contours=dict(start=0.5, end=0.5, size=2), line_width=3,
            contours_coloring='lines',
            colorscale=[[0, 'black'], [1, 'black']], showscale=False, 
            name='Decision Boundary (wTx+b=0)'
        ))
        
        # 真实数据点
        fig_bound.add_trace(go.Scatter(
            x=X[:, 0], y=X[:, 1], mode='markers',
            marker=dict(color=y, colorscale='RdBu', line=dict(color='white', width=1), size=10),
            text=[f"True: {yi}" for yi in y],
            name='Data Points'
        ))
        
        fig_bound.update_layout(
            title="2D 特征空间与线性边界",
            xaxis_title="Feature 1", yaxis_title="Feature 2",
            height=500, legend=dict(x=0, y=1)
        )
        st.plotly_chart(fig_bound, use_container_width=True)

    # --- Tab 2: Sigmoid 曲线 (Empirical) ---
    with viz_tabs[1]:
        st.markdown("此图展示了数据点在 **线性得分 $z$** (X轴) 上的分布以及它们对应的 **Sigmoid 概率** (Y轴)。")
        
        # 1. 计算每个样本的 z = w^T x + b
        z_scores = np.dot(X, w) + b
        
        # 2. 生成理论 Sigmoid 曲线
        z_range = np.linspace(z_scores.min() - 1, z_scores.max() + 1, 300)
        sigmoid_probs = expit(z_range) # 1 / (1 + exp(-z))
        
        fig_sig = go.Figure()
        
        # 绘制理论曲线 (S-curve)
        fig_sig.add_trace(go.Scatter(
            x=z_range, y=sigmoid_probs,
            mode='lines',
            line=dict(color='black', width=3),
            name='Theoretical Sigmoid Function'
        ))
        
        # 绘制数据点
        # Y轴为真实标签 (0或1)，X轴为模型计算出的 z_score
        fig_sig.add_trace(go.Scatter(
            x=z_scores, y=y,
            mode='markers',
            marker=dict(
                color=y, colorscale='RdBu', 
                symbol='circle', size=8,
                line=dict(color='white', width=1)
            ),
            name='Empirical Data (z vs y)',
            text=[f"z={z:.2f}, y={yi}" for z, yi in zip(z_scores, y)],
            hovertemplate="Linear Score: %{x:.2f}<br>True Label: %{y}<extra></extra>"
        ))
        
        # 绘制预测错误的点 (高亮)
        # 找出预测错误的索引
        wrong_mask = y_pred != y
        if np.any(wrong_mask):
            fig_sig.add_trace(go.Scatter(
                x=z_scores[wrong_mask], y=y[wrong_mask],
                mode='markers',
                marker=dict(symbol='x-open', size=12, color='red', line=dict(width=2)),
                name='Misclassified Points'
            ))

        # 装饰
        fig_sig.add_hline(y=0.5, line_dash="dash", line_color="gray", annotation_text="Threshold 0.5")
        fig_sig.add_vline(x=0.0, line_dash="dash", line_color="gray", annotation_text="Boundary z=0")

        fig_sig.update_layout(
            title="Empirical Sigmoid: Mapping Linear Score to Probability",
            xaxis_title="Linear Score (z = w^T x + b)",
            yaxis_title="Probability P(Y=1)",
            height=500,
            yaxis=dict(range=[-0.1, 1.1])
        )
        
        st.plotly_chart(fig_sig, use_container_width=True)
        st.info("""
        **图表解读：**
        * **X轴**：线性模型的输出值 $z$。$z=0$ 对应概率 0.5。
        * **S形曲线**：完美的 Sigmoid 函数。
        * **点**：真实数据。红色的点位于左边却属于类1，或位于右边却属于类0，代表模型在这些点上**分类错误**。
        """)

# --- 底部：模型系数展示 ---
st.markdown("---")
st.markdown("### 🔢 模型参数估计结果")
c1, c2, c3 = st.columns(3)
c1.metric("Intercept (b)", f"{b:.4f}")
c2.metric("Weight 1 (w1)", f"{w[0]:.4f}")
c3.metric("Weight 2 (w2)", f"{w[1]:.4f}")