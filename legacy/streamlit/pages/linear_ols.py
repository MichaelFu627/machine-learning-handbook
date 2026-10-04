import streamlit as st
import numpy as np
import pandas as pd
import plotly.graph_objs as go
import statsmodels.api as sm
from scipy import stats

# --- 页面配置 ---
st.set_page_config(page_title="线性回归：MLE 与 OLS", page_icon="📈", layout="wide")

st.title("📈 线性回归 (Linear Regression)")
st.markdown("从 **概率视角 (MLE)** 和 **几何视角 (OLS)** 理解线性回归，并进行完整的统计诊断。")

# --- 侧边栏：真值与参数设置 ---
st.sidebar.header("🛠️ 上帝视角 (God Mode)")
st.sidebar.markdown("在这里设定数据的**真实生成过程 (Ground Truth)**：")

# 1. 真实参数
true_beta0 = st.sidebar.slider(r"真实截距 (True Intercept, $\beta_0$)", -5.0, 5.0, 1.0, step=0.1)
true_beta1 = st.sidebar.slider(r"真实斜率 (True Slope, $\beta_1$)", -5.0, 5.0, 2.5, step=0.1)

# 2. 噪声设置
noise_sigma = st.sidebar.slider(r"噪声标准差 (Error $\sigma$)", 0.1, 5.0, 1.5, step=0.1, help=r"控制残差 $\epsilon$ 的离散程度")

# 3. 样本量
n_samples = st.sidebar.slider("样本量 (Sample Size, $N$)", 10, 500, 100, step=10)

# 4. 重新采样按钮
if "ols_seed" not in st.session_state:
    st.session_state.ols_seed = 42
if st.sidebar.button("🎲 重新生成随机数据"):
    st.session_state.ols_seed += 1

# --- 数据生成 (Data Generation Process) ---
rng = np.random.default_rng(st.session_state.ols_seed)
X = rng.uniform(0, 10, n_samples)
# 添加截距项 (Design Matrix)
X_design = sm.add_constant(X) 
# 生成误差项 epsilon ~ N(0, sigma^2)
errors = rng.normal(0, noise_sigma, n_samples)
# 生成 Y
y = true_beta0 + true_beta1 * X + errors

# --- 模型训练 (Statsmodels OLS) ---
model = sm.OLS(y, X_design)
results = model.fit()

# 提取估计值
est_beta0 = results.params[0]
est_beta1 = results.params[1]
residuals = results.resid

# --- 页面布局 ---
col_math, col_viz = st.columns([4, 6])

# ==============================================================================
# 左侧：数学推导 (Math)
# ==============================================================================
with col_math:
    st.subheader("📐 数学原理：殊途同归")
    
    math_tabs = st.tabs(["基本假设", "最小二乘法 (OLS)", "最大似然估计 (MLE)"])
    
    with math_tabs[0]:
        st.markdown("### 1. 概率模型假设")
        st.markdown(r"我们要建立的模型假设数据是由以下过程生成的：")
        st.latex(r"Y = \beta_0 + \beta_1 X + \epsilon")
        st.markdown(r"其中关键假设是关于误差项 $\epsilon$ 的：")
        st.latex(r"\epsilon \sim \mathcal{N}(0, \sigma^2) \quad \text{(i.i.d)}")
        st.info(r"""
        **这意味着：**
        1. **线性性**：$Y$ 和 $X$ 之间是线性关系。
        2. **独立性**：样本之间互不影响。
        3. **正态性**：误差服从正态分布（用于做统计检验）。
        4. **同方差性**：误差的方差 $\sigma^2$ 是常数。
        """)
        
    with math_tabs[1]:
        st.markdown("### 2. 最小二乘估计 (Least Squares)")
        st.markdown("这是从**几何视角**出发，寻找一条线，使得所有点沿 y 轴到拟合线的残差平方和最小。")
        
        st.markdown("**损失函数 (RSS - Residual Sum of Squares):**")
        st.latex(r"J(\beta) = \sum_{i=1}^N (y_i - (\beta_0 + \beta_1 x_i))^2")
        
        st.markdown(r"通过对 $\beta$ 求导并令其为 0，得到解析解：")
        st.latex(r"\hat{\beta}_{OLS} = (X^T X)^{-1} X^T Y")
        st.caption("最小化 RSS 不需要正态性；满列秩保证唯一解。无偏性需要 E[ε|X]=0 等条件，精确的小样本检验另需分布假设。")

    with math_tabs[2]:
        st.markdown("### 3. 最大似然估计 (MLE)")
        st.markdown(r"这是从**概率视角**出发。既然 $\epsilon \sim \mathcal{N}(0, \sigma^2)$，那么 $y_i$ 也服从正态分布：")
        st.latex(r"y_i \sim \mathcal{N}(\beta_0 + \beta_1 x_i, \sigma^2)")
        
        st.markdown("**似然函数 (Likelihood):**")
        st.latex(r"L(\beta, \sigma^2) = \prod_{i=1}^N \frac{1}{\sqrt{2\pi\sigma^2}} \exp\left( -\frac{(y_i - \hat{y}_i)^2}{2\sigma^2} \right)")
        
        st.markdown("**对数似然 (Log-Likelihood):**")
        st.markdown("为了方便计算，我们取对数：")
        st.latex(r"\ln L = -\frac{N}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2} \sum_{i=1}^N (y_i - \hat{y}_i)^2")
        
        st.markdown("**推导结论：**")
        st.markdown(r"观察上式，要最大化 $\ln L$，等价于**最小化**后面那一项：")
        st.latex(r"\sum (y_i - \hat{y}_i)^2")
        st.success("💡 发现了吗？在高斯噪声假设下，**MLE 等价于 OLS**！这就是为什么我们常用的线性回归公式如此强大。")

# ==============================================================================
# 右侧：可视化与诊断 (Visuals)
# ==============================================================================
with col_viz:
    st.subheader("📊 拟合结果与诊断")
    
    # --- 图表 1: 回归拟合图 ---
    x_range = np.linspace(0, 10, 100)
    y_true_line = true_beta0 + true_beta1 * x_range
    y_est_line = est_beta0 + est_beta1 * x_range
    
    fig_reg = go.Figure()
    
    # 1. 散点数据
    fig_reg.add_trace(go.Scatter(
        x=X, y=y, mode='markers',
        marker=dict(color='rgba(100, 100, 100, 0.6)', size=8),
        name='观测数据 (Observed)'
    ))
    
    # 2. 真实生成线
    fig_reg.add_trace(go.Scatter(
        x=x_range, y=y_true_line, mode='lines',
        line=dict(color='green', dash='dash', width=2),
        name=f'真实模型 (True): y={true_beta1}x+{true_beta0}'
    ))
    
    # 3. 拟合线
    fig_reg.add_trace(go.Scatter(
        x=x_range, y=y_est_line, mode='lines',
        line=dict(color='red', width=3),
        name=f'OLS 拟合: y={est_beta1:.2f}x+{est_beta0:.2f}'
    ))
    
    fig_reg.update_layout(
        title="拟合效果对比 (Truth vs Fitted)",
        xaxis_title="X (Input)", yaxis_title="Y (Output)",
        height=400, margin=dict(l=0, r=0, t=30, b=0),
        legend=dict(x=0, y=1)
    )
    st.plotly_chart(fig_reg, use_container_width=True)

    # --- 图表 2: 残差分布图 ---
    # 使用 Plotly 的 Figure Factory 做直方图+KDE
    # 为了对比，生成一个理论的正态分布曲线
    
    # 直方图数据
    hist_data = [residuals]
    group_labels = ['残差分布 (Residuals)']
    
    fig_resid = go.Figure()
    fig_resid.add_trace(go.Histogram(x=residuals, histnorm="probability density", xbins=dict(size=noise_sigma/2), marker_color="#3366CC", opacity=0.5, name="残差直方图"))
    kde_x = np.linspace(residuals.min(), residuals.max(), 150)
    fig_resid.add_trace(go.Scatter(x=kde_x, y=stats.gaussian_kde(residuals)(kde_x), mode="lines", name="Residual KDE"))
    
    # 添加理论正态分布 (N(0, sigma_hat))
    x_norm = np.linspace(min(residuals), max(residuals), 100)
    # 使用估计出的残差标准误 (scale)
    resid_std_est = np.std(residuals, ddof=2) # ddof=p 
    y_norm = stats.norm.pdf(x_norm, 0, resid_std_est)
    
    fig_resid.add_trace(go.Scatter(
        x=x_norm, y=y_norm, mode='lines',
        line=dict(color='orange', dash='dot', width=2),
        name=f'理论正态 (Normal Dist)'
    ))
    
    fig_resid.update_layout(
        title="残差正态性诊断 (Residual Normality Check)",
        xaxis_title="Residuals (y - y_hat)", yaxis_title="Density",
        height=350, margin=dict(l=0, r=0, t=40, b=0),
        showlegend=True
    )
    st.plotly_chart(fig_resid, use_container_width=True)

# ==============================================================================
# 底部：统计推断表 (Statistical Output)
# ==============================================================================
st.markdown("---")
st.subheader("📝 统计推断摘要 (Model Summary)")

# 准备数据
summary_df = pd.DataFrame({
    "Coefficient": ["Intercept (beta0)", "Slope (beta1)"],
    "Estimate": [est_beta0, est_beta1],
    "Std. Error": results.bse,
    "t-value": results.tvalues,
    "p-value": results.pvalues
})

# 添加显著性星号
def get_stars(p):
    if p < 0.001: return '***'
    if p < 0.01: return '**'
    if p < 0.05: return '*'
    if p < 0.1: return '.'
    return ''

summary_df["Significance"] = summary_df["p-value"].apply(get_stars)

# 格式化数字
summary_df["Estimate"] = summary_df["Estimate"].apply(lambda x: f"{x:.4f}")
summary_df["Std. Error"] = summary_df["Std. Error"].apply(lambda x: f"{x:.4f}")
summary_df["t-value"] = summary_df["t-value"].apply(lambda x: f"{x:.3f}")
summary_df["p-value"] = summary_df["p-value"].apply(lambda x: f"{x:.3e}" if x < 0.001 else f"{x:.3f}")

# 1. 系数表 (Coefficients)
st.table(summary_df.set_index("Coefficient"))
st.caption("Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1")

# 2. 模型整体统计量 (Model Statistics)
m_col1, m_col2, m_col3, m_col4 = st.columns(4)

with m_col1:
    st.metric(label="R-squared (R²)", value=f"{results.rsquared:.4f}", help="解释方差的比例，越接近1越好")
    st.metric(label="Adjusted R²", value=f"{results.rsquared_adj:.4f}")

with m_col2:
    # RSE Calculation
    rse = np.sqrt(results.mse_resid)
    st.metric(label="Residual Std. Error", value=f"{rse:.4f}", help="残差的标准差，衡量模型平均预测误差")
    st.metric(label="Degrees of Freedom", value=f"{int(results.df_resid)}")

with m_col3:
    st.metric(label="F-statistic", value=f"{results.fvalue:.2f}", help="检验整体模型是否显著优于空模型")
    
with m_col4:
    f_pvalue = results.f_pvalue
    f_p_str = f"{f_pvalue:.3e}" if f_pvalue < 0.001 else f"{f_pvalue:.3f}"
    st.metric(label="Prob (F-statistic)", value=f_p_str, delta="Significant" if f_pvalue < 0.05 else "Not Significant", delta_color="inverse")