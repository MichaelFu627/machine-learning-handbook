import streamlit as st
import numpy as np
import plotly.graph_objs as go
import plotly.figure_factory as ff
from scipy.stats import norm

st.markdown("# 🎲 MCMC: Metropolis-Hastings 采样")
st.markdown("当我们无法直接从目标分布 $P(x)$ 采样（或者不知道归一化常数）时，我们构建一个马尔可夫链，使其平稳分布收敛于 $P(x)$。")

# --- Sidebar ---
st.sidebar.header("采样器参数")
n_samples = st.sidebar.slider("采样数量", 100, 5000, 1000, step=100)
proposal_width = st.sidebar.slider(r"建议分布宽度 (Step Size $\sigma$)", 0.1, 5.0, 0.5, help="Proposal distribution Q(x'|x) 的标准差。太小=走得慢；太大=老被拒绝。")
start_x = st.sidebar.slider("起始位置 $x_0$", -4.0, 4.0, 0.0)
burn_in = st.sidebar.slider("Burn-in (丢弃前 N 个)", 0, n_samples - 10, min(100, n_samples - 10))

# --- Target Distribution (Unnormalized) ---
# 双峰分布：0.3 * N(-2, 1) + 0.7 * N(2, 1)
def target_pdf(x):
    return 0.3 * norm.pdf(x, loc=-2, scale=0.8) + 0.7 * norm.pdf(x, loc=2, scale=0.8)

# --- Metropolis-Hastings Algorithm ---
from ml_handbook.algorithms import metropolis
chain = metropolis(n_samples, burn_in, proposal_width, start_x, seed=42)
samples = chain["states"]
final_samples = chain["retained"]
acceptance_rate = chain["acceptance"]

# --- Layout ---
col_math, col_viz = st.columns([4, 6])

with col_math:
    st.subheader("📐 数学原理")
    
    st.markdown("### 1. 目标")
    st.markdown(r"从复杂分布 $P(x)$ 中生成样本。通常 $P(x) = \frac{\tilde{P}(x)}{Z}$，其中 $Z$ 很难计算。MCMC 的妙处在于**不需要知道 $Z$**。")
    
    st.markdown("### 2. 算法流程 (Metropolis)")
    st.markdown("在时刻 $t$，当前状态为 $x_t$：")
    st.markdown(r"1. **建议 (Propose)**：从建议分布 $Q(x'|x_t)$ 采样一个候选点 $x'$。通常用高斯分布 $x' \sim \mathcal{N}(x_t, \sigma^2)$。")
    st.markdown(r"2. **接受率 (Acceptance Ratio)**：计算接受概率 $\alpha$：")
    st.latex(r"\alpha = \min \left(1, \frac{P(x')}{P(x_t)} \right)")
    st.caption("注意：归一化常数 $Z$ 在分子分母中被约掉了！")
    
    st.markdown("3. **决策 (Decision)**：")
    st.markdown(r"* 以概率 $\alpha$ 接受 $x'$ (令 $x_{t+1} = x'$)。")
    st.markdown("* 否则拒绝 (保持原地不动，$x_{t+1} = x_t$)。")
    
    st.markdown("---")
    st.markdown("### 3. 细致平衡条件")
    st.markdown("该算法保证了马尔可夫链满足**细致平衡 (Detailed Balance)**：")
    st.latex(r"P(x) T(x \to x') = P(x') T(x' \to x)")
    st.markdown("这确保了链的平稳分布就是我们的目标分布 $P(x)$。")

with col_viz:
    st.subheader("📊 采样过程诊断")
    
    # Plot 1: Trace Plot (Walker's Path)
    fig_trace = go.Figure()
    fig_trace.add_trace(go.Scatter(
        y=samples, mode='lines', 
        line=dict(color='rgba(0,0,0,0.5)', width=1),
        name='Trace'
    ))
    # Mark Burn-in area
    fig_trace.add_vrect(x0=0, x1=burn_in, fillcolor="red", opacity=0.1, annotation_text="Burn-in", annotation_position="top left")
    
    fig_trace.update_layout(
        title=f"1. 采样轨迹 (Trace Plot) - 接受率: {acceptance_rate:.2%}",
        xaxis_title="Iteration", yaxis_title="Value (x)",
        height=300, margin=dict(t=30, b=0)
    )
    st.plotly_chart(fig_trace, use_container_width=True)
    
    # Plot 2: Histogram vs True Density
    fig_hist = go.Figure()
    
    # Histogram of samples
    fig_hist.add_trace(go.Histogram(
        x=final_samples, histnorm='probability density',
        marker_color='#3366CC', opacity=0.6,
        name='MCMC Samples'
    ))
    
    # True Density Curve
    x_range = np.linspace(-6, 6, 200)
    y_true = target_pdf(x_range) # Note: this is slightly unnormalized visually if Z is not 1, but fits the shape
    fig_hist.add_trace(go.Scatter(
        x=x_range, y=y_true, mode='lines',
        line=dict(color='red', width=3),
        name='Target P(x)'
    ))
    
    fig_hist.update_layout(
        title="2. 采样分布 vs 真实分布",
        xaxis_title="x", yaxis_title="Density",
        height=350, margin=dict(t=40, b=0)
    )
    st.plotly_chart(fig_hist, use_container_width=True)
    
    st.metric("保留样本数", len(final_samples))
    st.metric("跨零点次数", chain["crossings"])
    if chain["crossings"] == 0:
        st.warning("保留轨迹未跨越零点，可能尚未探索另一模态。增加采样并检查多条链。")
    else:
        st.info("跨零点次数和接受率均不能证明收敛。请结合自相关、有效样本量和多链诊断判断。")
    st.caption("这里使用对称高斯建议，是 Metropolis-Hastings 的对称特例；本例目标密度恰好已归一化。")
