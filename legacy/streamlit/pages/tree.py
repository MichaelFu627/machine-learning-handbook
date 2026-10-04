import streamlit as st
import numpy as np
import plotly.graph_objs as go
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.datasets import make_moons
import matplotlib.pyplot as plt

st.markdown("# 🌳 决策树 (Decision Tree)")

# --- Sidebar ---
st.sidebar.header("参数剪枝")
max_depth = st.sidebar.slider("最大深度 (Max Depth)", 1, 10, 3)
criterion = st.sidebar.selectbox("分裂标准", ["gini", "entropy"])

# --- Data ---
X, y = make_moons(n_samples=200, noise=0.25, random_state=42)

# --- Model ---
clf = DecisionTreeClassifier(max_depth=max_depth, criterion=criterion)
clf.fit(X, y)

# --- Layout ---
col_math, col_viz = st.columns([4, 6])

with col_math:
    st.subheader("📐 数学原理 (Information Theory)")
    st.markdown("决策树通过递归地切割特征空间来通过降低“不纯度” (Impurity)。")
    
    if criterion == "entropy":
        st.markdown("### 1. 熵 (Entropy)")
        st.latex(r"H(D) = - \sum_{k=1}^K p_k \log_2(p_k)")
        st.markdown("### 2. 信息增益 (Information Gain)")
        st.latex(r"Gain(D, A) = H(D) - \sum_{v \in Values(A)} \frac{|D_v|}{|D|} H(D_v)")
    else:
        st.markdown("### 1. 基尼系数 (Gini Impurity)")
        st.latex(r"Gini(D) = 1 - \sum_{k=1}^K p_k^2")
        st.markdown("基尼系数越小，纯度越高。")
    
    st.markdown("### 3. 递归划分")
    st.markdown("算法遍历所有特征的所有可能切分点，寻找使 Gain 最大（或 Gini 最小）的那一刀。")
    
    # 显示树结构图 (Matplotlib)
    st.markdown("---")
    st.markdown("**树结构可视化:**")
    fig_tree, ax = plt.subplots(figsize=(6, 4))
    plot_tree(clf, filled=True, feature_names=["x1", "x2"], class_names=["0", "1"], rounded=True, ax=ax)
    st.pyplot(fig_tree)

with col_viz:
    st.subheader("👀 决策边界可视化")
    
    x_min, x_max = X[:, 0].min()-0.5, X[:, 0].max()+0.5
    y_min, y_max = X[:, 1].min()-0.5, X[:, 1].max()+0.5
    xx, yy = np.meshgrid(np.linspace(x_min, x_max, 200), np.linspace(y_min, y_max, 200))
    Z = clf.predict(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)
    
    fig = go.Figure()
    fig.add_trace(go.Contour(
        z=Z, x=np.linspace(x_min, x_max, 200), y=np.linspace(y_min, y_max, 200),
        colorscale='RdBu', opacity=0.4, showscale=False
    ))
    fig.add_trace(go.Scatter(
        x=X[:, 0], y=X[:, 1], mode='markers',
        marker=dict(color=y, colorscale='RdBu', line=dict(color='white', width=1)),
        name='Data'
    ))
    
    st.plotly_chart(fig, use_container_width=True)
    st.info("注意：决策树的边界总是**正交的（矩形切割）**，由平行于坐标轴的线段组成。随着深度增加，它能拟合任意形状，但也容易过拟合。")