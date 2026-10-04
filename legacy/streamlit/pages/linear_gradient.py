import streamlit as st
import numpy as np
import plotly.graph_objs as go

st.set_page_config(page_title="梯度下降可视化", page_icon="📉", layout="wide")

st.markdown("# 📉 梯度下降 (Gradient Descent)")
st.markdown("线性回归的参数求解通常有两种方法：**解析解 (OLS / Normal Equation)** 和 **数值优化 (Gradient Descent)**。这里我们探索后者。")

# --- 侧边栏参数 ---
st.sidebar.header("🎛️ 优化器参数")
learning_rate = st.sidebar.slider(r"学习率 (Learning Rate, $\eta$)", 0.005, 0.65, 0.05, step=0.005, format="%.3f")
iterations = st.sidebar.slider("迭代次数 (Iterations)", 5, 100, 20)
start_x = st.sidebar.slider("起始点 X", -10.0, 10.0, 8.0)
start_y = st.sidebar.slider("起始点 Y", -10.0, 10.0, -8.0)

# --- 定义损失函数 (以简单的凸函数为例) ---
# 为了可视化清晰，我们不使用真实数据的 MSE，而是使用一个标准的碗状函数
# J(x, y) = x^2 + 2y^2 (这是一个椭圆抛物面，模拟 loss surface)
def loss_function(x, y):
    return x**2 + 2 * y**2

def gradient(x, y):
    # J 对 x 的偏导: 2x
    # J 对 y 的偏导: 4y
    return np.array([2 * x, 4 * y])

# --- 执行梯度下降 ---
history = []
curr_x, curr_y = start_x, start_y
history.append((curr_x, curr_y, loss_function(curr_x, curr_y)))

for _ in range(iterations):
    grad = gradient(curr_x, curr_y)
    curr_x = curr_x - learning_rate * grad[0]
    curr_y = curr_y - learning_rate * grad[1]
    history.append((curr_x, curr_y, loss_function(curr_x, curr_y)))

history = np.array(history)

# --- 页面布局 ---
col_math, col_viz = st.columns([4, 6])

with col_math:
    st.subheader("📐 理论推导")
    
    st.markdown("### 1. 目标")
    st.markdown(r"我们需要最小化损失函数 $J(\theta)$。在右图中，Z轴高度代表损失值（Error），我们的目标是到达最低点（谷底）。")
    
    st.markdown("### 2. 更新规则 (Update Rule)")
    st.markdown(r"梯度 $\nabla J(\theta)$ 指向函数增长最快的方向。为了最小化，我们要往梯度的**反方向**走。")
    
    st.latex(r"\theta_{new} = \theta_{old} - \eta \cdot \nabla J(\theta_{old})")
    
    st.markdown(r"""
    其中：
    * $\theta$: 模型参数 (权重 $w, b$)
    * $\eta$: **学习率 (Learning Rate)**，控制步长大小。
    * $\nabla J$: 损失函数的梯度向量。
    """)
    
    st.markdown("---")
    st.markdown("### 3. 当前实验数值")
    st.latex(r"J(x, y) = x^2 + 2y^2")
    st.latex(r"\nabla J = \begin{bmatrix} 2x \\ 4y \end{bmatrix}")
    
    st.metric("最终损失 (Loss)", f"{history[-1][2]:.4e}")
    st.metric("最终坐标 (Global Min at 0,0)", f"({history[-1][0]:.2f}, {history[-1][1]:.2f})")
    
    if np.any(np.abs(history[-1][:2]) > 1e5):
        st.error("⚠️ 发散警告！学习率过大，导致参数爆炸。")
    elif learning_rate >= 0.5:
        st.warning("当前学习率超出严格收敛区间 0 < η < 0.5；非零 y 初值通常不会收敛。")
    elif learning_rate > 0.25:
        st.warning("⚠️ 震荡警告！步子太大，在山谷两侧跳跃。")

with col_viz:
    st.subheader("🏔️ 优化轨迹可视化")
    
    # 1. 创建背景网格 (等高线/曲面)
    limit = 12
    x_range = np.linspace(-limit, limit, 100)
    y_range = np.linspace(-limit, limit, 100)
    xx, yy = np.meshgrid(x_range, y_range)
    zz = loss_function(xx, yy)
    
    # 2. 绘制
    fig = go.Figure()
    
    # 绘制 Loss Surface (等高线)
    fig.add_trace(go.Contour(
        z=zz, x=x_range, y=y_range,
        colorscale='Viridis', opacity=0.5,
        ncontours=30, name='Loss Surface'
    ))
    
    # 绘制起点
    fig.add_trace(go.Scatter(
        x=[history[0][0]], y=[history[0][1]],
        mode='markers', marker=dict(size=12, color='red', symbol='x'),
        name='Start Point'
    ))
    
    # 绘制轨迹 (箭头/连线)
    fig.add_trace(go.Scatter(
        x=history[:, 0], y=history[:, 1],
        mode='lines+markers',
        marker=dict(size=5, color='white'),
        line=dict(color='white', width=2, dash='dot'),
        name='Gradient Steps'
    ))
    
    # 绘制终点
    fig.add_trace(go.Scatter(
        x=[history[-1][0]], y=[history[-1][1]],
        mode='markers', marker=dict(size=12, color='yellow', symbol='star'),
        name='End Point'
    ))

    fig.update_layout(
        title=f"梯度下降轨迹 (Learn Rate={learning_rate})",
        xaxis_title=r"Parameter $\theta_1$",
        yaxis_title=r"Parameter $\theta_2$",
        height=600,
        xaxis=dict(range=[-limit, limit]),
        yaxis=dict(range=[-limit, limit]),
        margin=dict(l=0, r=0, t=40, b=0)
    )
    
    st.plotly_chart(fig, use_container_width=True)
    st.caption("💡 提示：试着调大“学习率”，观察轨迹是变得更直（快速收敛）还是开始在山谷两边震荡（Z-zagging）甚至飞出屏幕（发散）。")