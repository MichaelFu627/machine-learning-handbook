import streamlit as st
import plotly.graph_objs as go
import numpy as np
from sklearn.datasets import make_circles, make_blobs, make_moons
from sklearn.svm import SVC

# --- 页面全局配置 ---
st.set_page_config(page_title="SVM 深度解析：核函数与对偶性", page_icon="⚔️", layout="wide")

st.title("⚔️ 支持向量机 (SVM): 核函数与数学原理深度探索")

# --- 侧边栏：参数控制 ---
st.sidebar.header("🎛️ 实验控制台")

# 1. 数据集选择
st.sidebar.subheader("1. 数据生成")
dataset_type = st.sidebar.selectbox(
    "选择数据分布",
    ("线性不可分 (Moons)", "非线性环形 (Circles)", "线性可分 (Blobs)")
)
noise_level = st.sidebar.slider("噪声强度 (Noise)", 0.0, 0.5, 0.1, step=0.05)
N_SAMPLES = 300

# 2. 核函数选择
st.sidebar.subheader("2. 核函数 (Kernel) 设置")
kernel_type = st.sidebar.selectbox(
    "选择核函数",
    ("rbf", "poly", "sigmoid", "linear"),
    format_func=lambda x: {
        "rbf": "高斯核 (RBF/Radial Basis)",
        "poly": "多项式核 (Polynomial)",
        "sigmoid": "Sigmoid 核 (神经网络层)",
        "linear": "线性核 (Linear)"
    }[x]
)

# 动态显示参数
gamma_val = 'scale'
degree_val = 3
coef0_val = 0.0

if kernel_type in ["rbf", "poly", "sigmoid"]:
    gamma_val = st.sidebar.slider(r"Gamma ($\gamma$): 影响单个样本的作用范围", 0.01, 10.0, 1.0)

if kernel_type == "poly":
    degree_val = st.sidebar.slider("Degree ($d$): 多项式最高次数", 1, 6, 3)
    coef0_val = st.sidebar.slider("Coef0 ($r$): 高次项与低次项的权重", 0.0, 5.0, 1.0)

if kernel_type == "sigmoid":
    coef0_val = st.sidebar.slider("Coef0 ($r$): 截距项", -5.0, 5.0, 0.0)

# 3. 正则化
st.sidebar.subheader("3. 正则化")
c_value = st.sidebar.slider("C (惩罚系数)", 0.01, 10.0, 1.0, help="C 越大，间隔违例惩罚越强；仍然是软间隔问题，不可分数据不会因此变得可分。")

# --- 数据生成 ---
if dataset_type == "线性可分 (Blobs)":
    X, y = make_blobs(n_samples=N_SAMPLES, centers=2, random_state=42, cluster_std=1.2 + noise_level)
elif dataset_type == "非线性环形 (Circles)":
    X, y = make_circles(n_samples=N_SAMPLES, factor=0.4, noise=noise_level, random_state=42)
else:
    X, y = make_moons(n_samples=N_SAMPLES, noise=noise_level, random_state=42)

# --- 模型训练 ---
# 使用 scikit-learn 的标准接口
clf = SVC(kernel=kernel_type, C=c_value, gamma=gamma_val, degree=degree_val, coef0=coef0_val)
clf.fit(X, y)

# 获取支持向量信息
support_vectors = clf.support_vectors_
support_indices = clf.support_
n_support = len(support_vectors)
# alpha * y (Dual Coefficients)
dual_coefs = clf.dual_coef_[0]

# --- 页面布局 ---
col_math, col_viz = st.columns([4, 6])

# ==============================================================================
# 左侧：深度数学解析 (Math & Derivation)
# ==============================================================================
with col_math:
    st.subheader("📐 数学原理深度解析")
    
    # --- 模块 1: 通俗解释 ---
    with st.expander("📖 入门：拉格朗日乘子是什么？(点击展开)", expanded=True):
        st.markdown(r"""
        **直观理解：登山与绳子**
        想象你在爬山，你的目标是**下到山谷最低处**（最小化损失函数 $f(x)$）。
        但是，你被一根绳子系在柱子上，只能在绳子长度范围内活动（约束条件 $g(x) \le 0$）。
        
        * **拉格朗日函数 ($L$)**：就是把“下山的愿望”和“绳子的拉力”结合起来的总能量。
        * **拉格朗日乘子 ($\alpha$)**：代表**绳子的拉力**。
            * 如果你的最低点本来就在绳子范围内，绳子是松的，拉力 $\alpha = 0$（这个样本不是支持向量）。
            * 如果你想去的地方被绳子勒住了，绳子绷得很紧，拉力 $\alpha > 0$（这个样本就是**支持向量**，它限制了你的模型）。
        """)

    # --- 模块 2: 核函数公式 ---
    st.markdown("### 当前核函数定义")
    if kernel_type == "linear":
        st.latex(r"K(x_i, x_j) = x_i^T x_j")
        st.caption("线性核：无升维，仅寻找原始空间分割线。")
    elif kernel_type == "poly":
        st.latex(rf"K(x_i, x_j) = (\gamma x_i^T x_j + r)^d")
        st.markdown(rf"参数: $\gamma={gamma_val}, r={coef0_val}, d={degree_val}$")
        st.caption("多项式核：将数据映射到所有 $d$ 阶多项式组合的特征空间。")
    elif kernel_type == "rbf":
        st.latex(r"K(x_i, x_j) = \exp(-\gamma ||x_i - x_j||^2)")
        st.markdown(rf"参数: $\gamma={gamma_val}$")
        st.caption("高斯核 (RBF)：将数据映射到**无限维**空间。数据点距离越近相似度越高。")
    elif kernel_type == "sigmoid":
        st.latex(r"K(x_i, x_j) = \tanh(\gamma x_i^T x_j + r)")
        st.markdown(rf"参数: $\gamma={gamma_val}, r={coef0_val}$")
        st.caption("Sigmoid 核：源自神经网络，模拟双曲正切激活函数。")

    # --- 模块 3: 硬核推导 (Primal to Dual) ---
    with st.expander("🧠 进阶：从原问题到对偶问题的完整推导", expanded=False):
        st.markdown("我们以软间隔 (Soft Margin) 为例。")
        
        st.markdown("**1. 原问题 (Primal Problem)**")
        # --- 修复：加了 r ---
        st.markdown(r"我们要找到最佳的 $w, b$ 以及松弛变量 $\xi$：")
        st.latex(r"\min_{w, b, \xi} \frac{1}{2}||w||^2 + C\sum_{i=1}^N \xi_i")
        st.markdown("约束条件：")
        st.latex(r"\begin{cases} y_i(w^T \phi(x_i) + b) \ge 1 - \xi_i \\ \xi_i \ge 0 \end{cases}")

        st.markdown("---")
        st.markdown("**2. 构造拉格朗日函数**")
        # --- 修复：加了 r ---
        st.markdown(r"引入拉格朗日乘子 $\alpha_i \ge 0$ 和 $\mu_i \ge 0$：")
        st.latex(r"""
        L(w, b, \xi, \alpha, \mu) = \frac{1}{2}||w||^2 + C\sum \xi_i - \sum \alpha_i [y_i(w^T \phi(x_i) + b) - 1 + \xi_i] - \sum \mu_i \xi_i
        """)

        st.markdown("---")
        st.markdown(r"**3. 求解极小值 (对 $w, b, \xi$ 求偏导)**")
        st.markdown("令偏导数为 0：")
        st.latex(r"\frac{\partial L}{\partial w} = w - \sum \alpha_i y_i \phi(x_i) = 0 \implies w = \sum_{i=1}^N \alpha_i y_i \phi(x_i)")
        st.latex(r"\frac{\partial L}{\partial b} = -\sum \alpha_i y_i = 0 \implies \sum_{i=1}^N \alpha_i y_i = 0")
        st.latex(r"\frac{\partial L}{\partial \xi_i} = C - \alpha_i - \mu_i = 0 \implies C = \alpha_i + \mu_i")

        st.markdown("---")
        st.markdown("**4. 代回原式得到对偶问题 (Dual Problem)**")
        # --- 修复：加了 r ---
        st.markdown(r"将步骤 3 的关系代入 $L$，消去 $w, b, \xi$：")
        st.latex(r"""
        \begin{aligned}
        L &= \frac{1}{2} \sum \sum \alpha_i \alpha_j y_i y_j \phi(x_i)^T \phi(x_j) - \sum \sum \alpha_i \alpha_j y_i y_j \phi(x_i)^T \phi(x_j) + \sum \alpha_i \\
          &= \sum_{i=1}^N \alpha_i - \frac{1}{2} \sum_{i=1}^N \sum_{j=1}^N \alpha_i \alpha_j y_i y_j K(x_i, x_j)
        \end{aligned}
        """)
        st.markdown(r"注意：这里 $\phi(x_i)^T \phi(x_j)$ 被核函数 $K(x_i, x_j)$ 替代了（核技巧）。")

        st.markdown("---")
        st.markdown("**5. 最终对偶优化目标**")
        st.latex(r"\max_{\alpha} \sum \alpha_i - \frac{1}{2} \sum \sum \alpha_i \alpha_j y_i y_j K(x_i, x_j)")
        st.markdown("约束条件变为：")
        st.latex(r"0 \le \alpha_i \le C, \quad \sum \alpha_i y_i = 0")
        st.success("这就是我们在右侧可视化中实际求解的模型！")

# ==============================================================================
# 右侧：高阶可视化 (Visualization)
# ==============================================================================
with col_viz:
    st.subheader("🧊 实时模型可视化")
    
    viz_tabs = st.tabs(["🖼️ 2D 决策边界", "🏔️ 3D 决策函数地形图"])

    # --- 准备网格数据 ---
    # 建立比数据范围稍大的网格
    x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
    y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
    
    # 分辨率
    h = 0.05 
    xx, yy = np.meshgrid(np.arange(x_min, x_max, h), np.arange(y_min, y_max, h))
    
    # 预测整个网格的 decision_function 值 (Z值)
    # decision_function 返回决策得分；几何距离另需按权重范数归一化
    Z = clf.decision_function(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)

    # --- Tab 1: 2D 视图 ---
    with viz_tabs[0]:
        fig_2d = go.Figure()

        # 背景热力图 (距离场)
        fig_2d.add_trace(go.Contour(
            x=np.arange(x_min, x_max, h),
            y=np.arange(y_min, y_max, h),
            z=Z,
            colorscale="RdBu",
            opacity=0.4,
            contours=dict(start=0, end=0, size=2), # 重点显示0
            showscale=False,
            name="决策区域"
        ))

        # 决策边界 (黑色实线)
        fig_2d.add_trace(go.Contour(
            x=np.arange(x_min, x_max, h), y=np.arange(y_min, y_max, h), z=Z,
            contours_coloring='lines', line_width=3,
            contours=dict(start=0, end=0, size=2),
            colorscale=[[0, 'black'], [1, 'black']],
            showscale=False, name='决策边界 (f(x)=0)'
        ))

        # 间隔边界 (虚线, f(x)=1 和 f(x)=-1)
        fig_2d.add_trace(go.Contour(
            x=np.arange(x_min, x_max, h), y=np.arange(y_min, y_max, h), z=Z,
            contours_coloring='lines', line_width=1, line_dash='dash',
            contours=dict(start=-1, end=1, size=2),
            colorscale=[[0, 'grey'], [1, 'grey']],
            showscale=False, name='间隔边界'
        ))

        # 数据点
        fig_2d.add_trace(go.Scatter(
            x=X[:, 0], y=X[:, 1], mode='markers',
            marker=dict(color=y, colorscale='Portland', line=dict(width=1, color='white'), size=8),
            name='数据样本'
        ))

        # 支持向量
        fig_2d.add_trace(go.Scatter(
            x=support_vectors[:, 0], y=support_vectors[:, 1], mode='markers',
            marker=dict(
                size=14, color='rgba(0,0,0,0)', 
                line=dict(color='black', width=2),
                symbol='circle-open'
            ),
            name=f'支持向量 ({n_support}个)'
        ))

        fig_2d.update_layout(
            title="2D 投影与决策边界",
            xaxis_title="Feature 1", yaxis_title="Feature 2",
            height=600
        )
        st.plotly_chart(fig_2d, use_container_width=True)

    # --- Tab 2: 3D 视图 (决策函数地形) ---
    with viz_tabs[1]:
        st.info(r"""
        ℹ️ **关于 3D 视图的说明：**
        对于 RBF 或高阶多项式，特征空间可能是无限维的，无法直接画出 $w$ 所在的平面。
        这里的 Z 轴展示的是 **决策函数值** $f(x) = \sum \alpha_i y_i K(x_i, x) + b$。
        * **Z = 0 的平面** (水面) 与曲面的交线，就是左图的决策边界。
        * **Z > 0** 为一类，**Z < 0** 为另一类。
        """)

        fig_3d = go.Figure()

        # 1. 决策曲面 (地形)
        fig_3d.add_trace(go.Surface(
            x=xx, y=yy, z=Z,
            colorscale='RdBu',
            opacity=0.7,
            showscale=False,
            name='决策函数 f(x)'
        ))

        # 2. 零平面 (Reference Plane at Z=0)
        zeros = np.zeros_like(Z)
        fig_3d.add_trace(go.Surface(
            x=xx, y=yy, z=zeros,
            colorscale='Greys',
            opacity=0.3,
            showscale=False,
            name='超平面界 (Z=0)'
        ))

        # 3. 数据点 (映射到曲面上或投影在底部)
        # 为了看清，我们将数据点画在 Z=数据点真实标签的位置 (y=1 or -1)，或者是 decision function 的值
        # 这里我们画在 2D 平面上 (Z=min) 方便看投影，或者画在 Z=f(x) 上
        # 也就是画出 (x, y, f(x))
        decision_values_points = clf.decision_function(X)
        
        fig_3d.add_trace(go.Scatter3d(
            x=X[:, 0], y=X[:, 1], z=decision_values_points,
            mode='markers',
            marker=dict(
                size=5, 
                color=y, 
                colorscale='Portland',
                line=dict(width=1, color='white')
            ),
            name='样本点 (在曲面上)'
        ))
        
        # 4. 支持向量
        sv_decision_values = clf.decision_function(support_vectors)
        fig_3d.add_trace(go.Scatter3d(
            x=support_vectors[:, 0], y=support_vectors[:, 1], z=sv_decision_values,
            mode='markers',
            marker=dict(
                size=8, color='rgba(0,0,0,0)', 
                line=dict(color='black', width=5),
                symbol='circle-open'
            ),
            name='支持向量'
        ))

        fig_3d.update_layout(
            title=f"3D 决策函数地形图 ({kernel_type} kernel)",
            scene=dict(
                xaxis_title='X1', 
                yaxis_title='X2', 
                zaxis_title='Decision Value f(x)'
            ),
            height=600,
            margin=dict(l=0, r=0, b=0, t=40)
        )
        st.plotly_chart(fig_3d, use_container_width=True)

    # --- 底部信息栏 ---
    st.markdown("---")
    st.markdown(f"**当前模型统计：** 支持向量数量: `{n_support}` | 截距 b: `{clf.intercept_[0]:.4f}`")
    if kernel_type == 'linear':
         st.markdown(f"**线性权重 w:** `{clf.coef_[0]}`")