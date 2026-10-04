import streamlit as st
import numpy as np
import plotly.graph_objs as go
from sklearn.naive_bayes import GaussianNB
from sklearn.datasets import make_classification

st.markdown("# 🔔 朴素贝叶斯 (Naive Bayes)")

# --- Sidebar ---
st.sidebar.header("参数设置")
var_smoothing = st.sidebar.selectbox("方差平滑 (Variance Smoothing)", [1e-9, 1e-1, 1.0], index=0)

# --- Data ---
X, y = make_classification(n_samples=300, n_features=2, n_informative=2, n_redundant=0, n_clusters_per_class=1, random_state=10)

# --- Model ---
clf = GaussianNB(var_smoothing=var_smoothing)
clf.fit(X, y)

# --- Layout ---
col_math, col_viz = st.columns([4, 6])

with col_math:
    st.subheader("📐 数学原理 (Bayes Theorem)")
    st.markdown("这是一种**生成式模型**。我们分别对每个类别的数据分布进行建模。")
    
    st.markdown("### 1. 贝叶斯公式")
    st.latex(r"P(y|x) = \frac{P(x|y) P(y)}{P(x)}")
    st.markdown("""
    * $P(y|x)$: 后验概率 (Posterior) -> 我们想求的。
    * $P(x|y)$: **似然 (Likelihood)** -> 假设数据服从高斯分布。
    * $P(y)$: 先验概率 (Prior) -> 类别占比。
    """)
    
    st.markdown("### 2. 朴素假设 (Independence)")
    st.markdown("假设给定类别 y 后，特征条件独立：")
    st.latex(r"P(x|y) = \prod_{j=1}^d P(x_j|y)")
    
    st.markdown("### 3. 高斯似然")
    st.latex(r"P(x_j|y=k) = \frac{1}{\sqrt{2\pi\sigma_{kj}^2}} \exp\left(-\frac{(x_j - \mu_{kj})^2}{2\sigma_{kj}^2}\right)")
    st.caption(r"模型实际上是在计算每个类的中心 $\mu$ 和方差 $\sigma^2$，并在空间中画出椭圆。")

with col_viz:
    st.subheader("👀 高斯分布可视化")
    
    # Grid
    x_min, x_max = X[:, 0].min()-1, X[:, 0].max()+1
    y_min, y_max = X[:, 1].min()-1, X[:, 1].max()+1
    xx, yy = np.meshgrid(np.linspace(x_min, x_max, 100), np.linspace(y_min, y_max, 100))
    Z = clf.predict_proba(np.c_[xx.ravel(), yy.ravel()])[:, 1].reshape(xx.shape)
    
    fig = go.Figure()
    
    # 概率场
    fig.add_trace(go.Contour(
        z=Z, x=np.linspace(x_min, x_max, 100), y=np.linspace(y_min, y_max, 100),
        colorscale='Viridis', opacity=0.4, showscale=False
    ))
    
    # 决策边界
    fig.add_trace(go.Contour(
        z=Z, x=np.linspace(x_min, x_max, 100), y=np.linspace(y_min, y_max, 100),
        contours=dict(start=0.5, end=0.5, size=2), line_width=2,
        colorscale=[[0, 'black'], [1, 'black']], showscale=False, name='Boundary'
    ))
    
    # 数据
    fig.add_trace(go.Scatter(
        x=X[:, 0], y=X[:, 1], mode='markers',
        marker=dict(color=y, colorscale='Viridis', line=dict(color='white', width=1)),
        name='Data'
    ))
    
    # 绘制高斯中心 (Means)
    means = clf.theta_
    fig.add_trace(go.Scatter(
        x=means[:, 0], y=means[:, 1], mode='markers',
        marker=dict(symbol='x', size=15, color='red'),
        name='Class Means (μ)'
    ))
    
    st.plotly_chart(fig, use_container_width=True)
    st.info("观察：决策边界一般为二次曲线，特殊参数下可退化为线性边界，它是两个高斯分布交界的地方。")