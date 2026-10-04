import streamlit as st
import numpy as np
import pandas as pd
import plotly.graph_objs as go
from sklearn.linear_model import Ridge, Lasso, LinearRegression
from sklearn.datasets import make_regression, fetch_california_housing, load_diabetes
from sklearn.preprocessing import StandardScaler

st.set_page_config(page_title="正则化：Ridge & Lasso", page_icon="🦄", layout="wide")

st.markdown("# 🦄 正则化：Ridge & Lasso 的几何解释")
st.markdown("正则化通过在损失函数中加入**惩罚项 (Penalty)** 来限制模型复杂度，防止过拟合。从几何角度看，这是**损失函数等高线**与**参数约束域**寻找切点的过程。")

# ==============================================================================
# 1. 数据与设置 (Sidebar)
# ==============================================================================
st.sidebar.header("🎛️ 数据与参数")

# 1.1 数据集选择
data_source = st.sidebar.selectbox(
    "选择数据集",
    ["随机生成 (Random)", "加州房价 (California Housing)", "糖尿病预测 (Diabetes)"],
    help="为了在2D平面展示几何原理，无论选择哪个数据集，我们都将只选取指定的两个特征进行演示。"
)

# 1.2 正则化强度
alpha = st.sidebar.slider("正则化强度 (Alpha / Lambda)", 0.0, 10.0, 1.0, step=0.1, help="Alpha=0 时即为 OLS。Alpha 越大，约束域越小，系数越趋向于 0。")

# --- 数据处理函数 ---
@st.cache_data
def load_data(source):
    if source == "随机生成 (Random)":
        X, y = make_regression(n_samples=100, n_features=2, noise=10.0, effective_rank=1, random_state=42)
        feature_names = ["Feature 1", "Feature 2"]
    elif source == "加州房价 (California Housing)":
        data = fetch_california_housing()
        # 为了可视化，只取两个特征：MedInc (收入) 和 AveRooms (平均房间数)
        X = data.data[:, [0, 2]] 
        y = data.target
        feature_names = ["MedInc", "AveRooms"]
    else: # Diabetes
        data = load_diabetes()
        # 取两个特征：BMI 和 BP
        X = data.data[:, [2, 3]]
        y = data.target
        feature_names = ["BMI", "BP"]
    
    # ⚠️ 关键步骤：正则化必须配合标准化 (Standardization) 使用
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    # 中心化 y 以消除截距项的影响，方便在 2D 平面画图 (w1, w2)
    y_centered = y - np.mean(y)
    
    return X_scaled, y_centered, feature_names

X, y, feat_names = load_data(data_source)

# ==============================================================================
# 2. 模型计算 (OLS, Ridge, Lasso)
# ==============================================================================

# 2.1 OLS (无约束基准)
ols = LinearRegression(fit_intercept=False) # 数据已中心化，无需截距
ols.fit(X, y)
w_ols = ols.coef_

# 2.2 Ridge (L2)
ridge = Ridge(alpha=2 * len(y) * alpha, fit_intercept=False)
ridge.fit(X, y)
w_ridge = ridge.coef_

# 2.3 Lasso (L1)
lasso = Lasso(alpha=alpha, fit_intercept=False, max_iter=10000) if alpha > 0 else LinearRegression(fit_intercept=False)
lasso.fit(X, y)
w_lasso = lasso.coef_

# ==============================================================================
# 3. 辅助绘图函数：生成损失面和约束边界
# ==============================================================================
@st.cache_data
def get_loss_grid(X, y, w_center, range_val=3.0):
    # 生成网格
    w1_range = np.linspace(-range_val, range_val, 100) + w_center[0]
    w2_range = np.linspace(-range_val, range_val, 100) + w_center[1]
    ww1, ww2 = np.meshgrid(w1_range, w2_range)
    
    # 计算 RSS (Equivalent to -LogLikelihood for Gaussian)
    weights = np.stack((ww1, ww2), axis=-1)
    rss_grid = y @ y - 2 * weights @ (X.T @ y) + np.einsum("...i,ij,...j->...", weights, X.T @ X, weights)

    return w1_range, w2_range, rss_grid

def plot_regularization(model_type, w_sol, w_ols, X, y):
    # 1. 准备背景等高线 (RSS / Empirical Log-likelihood)
    w1_r, w2_r, Z = get_loss_grid(X, y, w_ols, range_val=max(np.linalg.norm(w_ols)*1.5, 2.0))
    
    fig = go.Figure()
    
    # --- A. 绘制 RSS 等高线 (椭圆) ---
    fig.add_trace(go.Contour(
        z=Z, x=w1_r, y=w2_r,
        colorscale='Greys', opacity=0.8, showscale=False,
        contours=dict(start=Z.min(), end=Z.max(), size=(Z.max()-Z.min())/15, coloring='lines'),
        line=dict(width=1.5),
        name='RSS Contours'
    ))
    
    # --- B. 绘制约束域 (Constraint Region) ---
    # 我们根据求解出的 w_sol 反推当前的 Budget (t)
    # 这样能确保约束边界正好经过我们的解
    if model_type == "Ridge":
        # L2: w1^2 + w2^2 <= t^2 (Circle)
        radius = np.linalg.norm(w_sol)
        # 画圆
        theta = np.linspace(0, 2*np.pi, 100)
        xc = radius * np.cos(theta)
        yc = radius * np.sin(theta)
        
        fig.add_trace(go.Scatter(
            x=xc, y=yc, mode='lines', fill='toself', fillcolor='rgba(0,0,255,0.1)',
            line=dict(color='blue', dash='dash'),
            name='L2 Constraint (Circle)'
        ))
        title_text = "Ridge (L2) Geometry"
        sol_color = "blue"
        
    else: # Lasso
        # L1: |w1| + |w2| <= t (Diamond)
        budget = np.sum(np.abs(w_sol))
        # 画菱形
        diamond_x = [budget, 0, -budget, 0, budget]
        diamond_y = [0, budget, 0, -budget, 0]
        
        fig.add_trace(go.Scatter(
            x=diamond_x, y=diamond_y, mode='lines', fill='toself', fillcolor='rgba(255,0,0,0.1)',
            line=dict(color='red', dash='dash'),
            name='L1 Constraint (Diamond)'
        ))
        title_text = "Lasso (L1) Geometry"
        sol_color = "red"

    # --- C. 标记关键点 ---
    # 1. OLS (Unconstrained Minimum)
    fig.add_trace(go.Scatter(
        x=[w_ols[0]], y=[w_ols[1]], mode='markers+text',
        marker=dict(symbol='star', size=15, color='black'),
        text=["OLS (MLE)"], textposition="top right",
        name='OLS Solution'
    ))
    
    # 2. Regularized Solution (Intersection)
    fig.add_trace(go.Scatter(
        x=[w_sol[0]], y=[w_sol[1]], mode='markers+text',
        marker=dict(size=12, color=sol_color),
        text=[f"{model_type} Solution"], textposition="bottom left",
        name=f'{model_type} Solution'
    ))
    
    # 布局设置
    fig.update_layout(
        title=title_text,
        xaxis_title=f"Coefficient: {feat_names[0]}",
        yaxis_title=f"Coefficient: {feat_names[1]}",
        height=600,
        xaxis=dict(zeroline=True, zerolinewidth=2, zerolinecolor='gray'),
        yaxis=dict(zeroline=True, zerolinewidth=2, zerolinecolor='gray'),
        # 强制 1:1 比例，否则圆会变成椭圆，误导视觉
        yaxis_scaleanchor="x", 
    )
    
    return fig

# ==============================================================================
# 4. 页面布局
# ==============================================================================

col_math, col_viz = st.columns([4, 6])

with col_math:
    st.subheader("📐 理论对比")
    
    st.markdown("### 1. 目标函数")
    st.markdown("我们同时最小化**经验误差 (RSS)** 和 **正则项 (Penalty)**：")
    
    st.latex(r"\hat{\beta} = \arg\min_{\beta} \underbrace{\frac{1}{2N}||y - X\beta||^2}_{\text{Likelihood}} + \lambda \underbrace{R(\beta)}_{\text{Penalty}}")
    st.caption("本页统一使用 RSS/(2N)+λR(β)，Ridge 的库参数为 2Nλ，Lasso 为 λ。注：这里的 RSS 等价于高斯噪声下的负对数似然 (Negative Log-Likelihood)。")

    st.markdown("### 2. 等价约束形式")
    st.markdown("上述拉格朗日形式等价于在约束条件下求 RSS 最小值：")
    st.latex(r"\min ||y - X\beta||^2 \quad \text{s.t.} \quad R(\beta) \le t")
    
    st.markdown("---")
    
    st.markdown("### 3. Ridge (L2 正则)")
    st.latex(r"R(\beta) = ||\beta||_2^2 = \sum \beta_j^2")
    st.markdown("""
    * **几何形状**：圆形 (2D) 或 球体 (3D)。
    * **特性**：平滑地收缩系数 (Shrinkage)。
    * **结果**：切点通常在坐标轴之间，系数只会趋近于 0 但很难等于 0。
    """)
    
    st.markdown("### 4. Lasso (L1 正则)")
    st.latex(r"R(\beta) = ||\beta||_1 = \sum |\beta_j|")
    st.markdown("""
    * **几何形状**：菱形 (2D) 或 多面体 (3D)。
    * **特性**：具有尖角 (Corners)。
    * **稀疏性 (Sparsity)**：等高线很容易先接触到**尖角**（即坐标轴）。一旦接触到尖角，对应的系数就变成了 **0**。这实现了特征选择。
    """)
    
    st.markdown("---")
    st.info(f"**当前数据:** {data_source}")
    st.metric("Features Used", f"{feat_names[0]}, {feat_names[1]}")

with col_viz:
    
    tab_ridge, tab_lasso = st.tabs(["🔵 Ridge (L2)", "🔴 Lasso (L1)"])
    
    with tab_ridge:
        fig_ridge = plot_regularization("Ridge", w_ridge, w_ols, X, y)
        st.plotly_chart(fig_ridge, use_container_width=True)
        st.markdown(f"**Ridge 系数:** `[{w_ridge[0]:.3f}, {w_ridge[1]:.3f}]`")
        if alpha > 0:
            st.success("观察：圆形约束域逐渐收缩，拉着解点（蓝色）从 OLS 点（黑色星号）向原点 (0,0) 移动，但很难正好落在轴上。")

    with tab_lasso:
        fig_lasso = plot_regularization("Lasso", w_lasso, w_ols, X, y)
        st.plotly_chart(fig_lasso, use_container_width=True)
        st.markdown(f"**Lasso 系数:** `[{w_lasso[0]:.3f}, {w_lasso[1]:.3f}]`")
        
        # 检测稀疏性
        is_sparse = np.any(np.abs(w_lasso) < 1e-4)
        if is_sparse and alpha > 0.1:
            st.warning("⚠️ **Sparsity Triggered!** 观察：解点（红色）落在了菱形的顶点上（即坐标轴上）。这意味着其中一个特征的系数被压缩为 0，模型完成了特征选择。")
        else:
            st.info("增加 Alpha 值，看看解点是否会被拉到坐标轴上（变成 0）。")