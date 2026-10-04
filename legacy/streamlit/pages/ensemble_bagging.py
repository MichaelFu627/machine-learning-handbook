import streamlit as st
import numpy as np
import plotly.graph_objs as go
from sklearn.ensemble import BaggingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import make_moons

st.markdown("# 🎒 Bagging (Bootstrap Aggregating)")

# --- Sidebar ---
st.sidebar.header("集成参数")
n_estimators = st.sidebar.slider("树的数量 (Number of Estimators)", 1, 50, 5)
base_depth = st.sidebar.slider("基学习器深度", 1, 10, 5)

# --- Data ---
X, y = make_moons(n_samples=300, noise=0.3, random_state=42)

# --- Model ---
# 比较单棵树 vs Bagging
tree = DecisionTreeClassifier(max_depth=base_depth)
bagging = BaggingClassifier(estimator=DecisionTreeClassifier(max_depth=base_depth), n_estimators=n_estimators, random_state=42)

tree.fit(X, y)
bagging.fit(X, y)

# --- Layout ---
col_math, col_viz = st.columns([4, 6])

with col_math:
    st.subheader("📐 数学原理")
    st.markdown("Bagging 的核心思想是通过**平均**来减少方差 (Variance Reduction)。")
    
    st.markdown("### 1. Bootstrap 采样")
    st.markdown("从大小为 $N$ 的原始数据集中，**有放回地**抽取 $N$ 个样本。")
    st.latex(r"D_1, D_2, \dots, D_T \quad (\text{resampled})")
    
    st.markdown("### 2. 模型聚合")
    st.markdown("在每个 $D_t$ 上独立训练一个模型 $h_t(x)$。最终预测结果为：")
    st.latex(r"H(x) = \arg\max_k \frac{1}{T}\sum_{t=1}^T P_t(y=k|x)")
    
    st.markdown("### 3. 为什么有效？")
    st.markdown(r"假设每个模型方差为 $\sigma^2$，相关系数为 $\rho$。集成的方差为：")
    st.latex(r"\text{Var}(H) = \rho \sigma^2 + \frac{1-\rho}{T}\sigma^2")
    st.caption("公式适用于等方差、等相关的数值预测平均；不是硬分类标签的一般方差公式。")

with col_viz:
    st.subheader("👀 边界对比")
    
    x_min, x_max = X[:, 0].min()-0.5, X[:, 0].max()+0.5
    y_min, y_max = X[:, 1].min()-0.5, X[:, 1].max()+0.5
    xx, yy = np.meshgrid(np.linspace(x_min, x_max, 100), np.linspace(y_min, y_max, 100))
    
    Z_tree = tree.predict(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)
    Z_bag = bagging.predict(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)
    
    viz_choice = st.radio("选择视图", ["单棵树 (High Variance)", "Bagging 集成 (Lower Variance)"], horizontal=True)
    
    Z_show = Z_tree if "单棵树" in viz_choice else Z_bag
    
    fig = go.Figure()
    fig.add_trace(go.Contour(
        z=Z_show, x=np.linspace(x_min, x_max, 100), y=np.linspace(y_min, y_max, 100),
        colorscale='RdBu', opacity=0.4, showscale=False
    ))
    fig.add_trace(go.Scatter(
        x=X[:, 0], y=X[:, 1], mode='markers',
        marker=dict(color=y, colorscale='RdBu', line=dict(color='white', width=1)),
        name='Data'
    ))
    st.plotly_chart(fig, use_container_width=True)
    
    if "Bagging" in viz_choice:
        st.info("比较边界变化；方差降低需通过多次重采样验证，单次实验不保证边界更平滑。")