import streamlit as st

# 注意：st.set_page_config 在被 st.navigation 调用时，通常只需要在 Home.py 设置一次即可，
# 但为了保险起见，或者如果这个页面被独立运行，保留它也无妨，只要配置不冲突。
# 在 st.navigation 模式下，通常只有 title 会生效。
st.title("🎓 统计机器学习 (Statistical Machine Learning)")

st.markdown("""
### 欢迎来到交互式学习平台

本项目旨在通过**可视化**和**实时交互**，帮助你直观地理解复杂的机器学习算法背后的数学原理。
我们不再局限于枯燥的公式推导，而是强调 **"数形结合" (Math + Geometry)** 的直觉建立。

---

### 📚 课程目录导航

请点击左侧侧边栏 (Sidebar) 展开学习模块：

#### 1. 监督学习：分类模型
* **支持向量机 (SVM)**: 探索最大间隔分类器、核技巧 (Kernel Trick) 与对偶理论。

#### 2. 监督学习：线性模型
这一模块包含三个层级递进的子课程：
* **理论与诊断 (OLS/MLE)**: 线性回归的概率假设、最大似然估计推导及残差诊断。
* **优化算法 (Gradient Descent)**: 梯度下降法的几何轨迹与收敛性分析。
* **正则化 (Ridge & Lasso)**: 解决过拟合与共线性问题，L1/L2 范数的几何意义及参数收缩路径。

---

### 🛠️ 技术栈
* **前端框架**: Streamlit (Python)
* **科学计算**: Statsmodels, Scikit-learn, NumPy, SciPy
* **交互绘图**: Plotly
""")

st.info("👈 请在左侧侧边栏选择具体的模型章节开始学习。")