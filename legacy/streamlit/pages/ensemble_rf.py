import streamlit as st
import numpy as np
import plotly.graph_objs as go
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_circles

st.markdown("# 🌲 随机森林 (Random Forest)")

# --- Sidebar ---
st.sidebar.header("RF 参数")
n_estimators = st.sidebar.slider("树的数量", 1, 100, 10)
max_depth = st.sidebar.slider("最大深度", 1, 10, 5)

# --- Data ---
X, y = make_circles(n_samples=300, factor=0.5, noise=0.1, random_state=42)

# --- Model ---
clf = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
clf.fit(X, y)

# --- Layout ---
col_math, col_viz = st.columns([4, 6])

with col_math:
    st.subheader("📐 数学原理 (Decorrelation)")
    st.markdown(r"随机森林是 Bagging 的升级版。为了进一步降低方差，RF 试图降低树之间的相关性 $\rho$。")
    
    st.markdown("### 1. 特征随机性 (Feature Randomness)")
    st.markdown("""
    在树的每个节点分裂时，**不是**在所有特征中寻找最优切分，而是：
    * 随机选择 $m$ 个特征 ($m < d$)。
    * 仅在这 $m$ 个特征中寻找最优切分。
    """)
    
    st.markdown("### 2. 目的")
    st.markdown("这迫使每棵树长得“不一样”。")
    st.latex(r"\text{Var}(H) = \rho \sigma^2 + \frac{1-\rho}{T}\sigma^2")
    st.info(r"通过特征随机性，$\rho$ (相关系数) 显著降低，从而使总方差更低，模型更鲁棒。")

with col_viz:
    st.subheader("👀 随机森林可视化")
    
    x_min, x_max = X[:, 0].min()-0.5, X[:, 0].max()+0.5
    y_min, y_max = X[:, 1].min()-0.5, X[:, 1].max()+0.5
    xx, yy = np.meshgrid(np.linspace(x_min, x_max, 100), np.linspace(y_min, y_max, 100))
    
    # 预测概率而不是类别，看起来更平滑
    Z = clf.predict_proba(np.c_[xx.ravel(), yy.ravel()])[:, 1].reshape(xx.shape)
    
    fig = go.Figure()
    
    # 概率热力图
    fig.add_trace(go.Contour(
        z=Z, x=np.linspace(x_min, x_max, 100), y=np.linspace(y_min, y_max, 100),
        colorscale='Viridis', opacity=0.6, showscale=True,
        name='Probability'
    ))
    
    # 数据点
    fig.add_trace(go.Scatter(
        x=X[:, 0], y=X[:, 1], mode='markers',
        marker=dict(color=y, colorscale='Viridis', line=dict(color='white', width=1)),
        name='Data'
    ))
    
    st.plotly_chart(fig, use_container_width=True)
    st.caption("热力图显示了集成的平滑效果。有限棵轴对齐树的聚合仍是分片常数；图形插值造成的平滑外观不代表模型连续。")