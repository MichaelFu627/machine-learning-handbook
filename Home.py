import streamlit as st

st.set_page_config(page_title="统计机器学习", page_icon="🎓", layout="wide")

# --- 页面定义 ---
page_intro = st.Page("legacy/streamlit/pages/intro.py", title="课程主页", icon="🏠", default=True)

# 1. 分类模型
page_logistic = st.Page("legacy/streamlit/pages/logistic.py", title="逻辑回归 (Logistic Regression)", icon="📉")
page_bayes = st.Page("legacy/streamlit/pages/bayes.py", title="朴素贝叶斯 (Naive Bayes)", icon="🔔")
page_svm = st.Page("legacy/streamlit/pages/svm_app.py", title="支持向量机 (SVM)", icon="⚔️")
page_tree = st.Page("legacy/streamlit/pages/tree.py", title="决策树 (Decision Tree)", icon="🌳")
page_bagging = st.Page("legacy/streamlit/pages/ensemble_bagging.py", title="集成学习：Bagging", icon="🎒")
page_rf = st.Page("legacy/streamlit/pages/ensemble_rf.py", title="集成学习：随机森林", icon="🌲")

# 2. 线性/回归模型
page_lin_ols = st.Page("legacy/streamlit/pages/linear_ols.py", title="理论与诊断 (OLS/MLE)", icon="📈")
page_lin_grad = st.Page("legacy/streamlit/pages/linear_gradient.py", title="优化算法：梯度下降", icon="📉")
page_lin_reg = st.Page("legacy/streamlit/pages/linear_ridge.py", title="正则化：Ridge & Lasso", icon="🦄")

# 3. 统计推断与采样 (NEW!)
page_em = st.Page("legacy/streamlit/pages/stat_em.py", title="EM 算法 (GMM Clustering)", icon="🔄")
page_mcmc = st.Page("legacy/streamlit/pages/stat_mcmc.py", title="MCMC (Metropolis-Hastings)", icon="🎲")

# --- 导航结构 ---
pg = st.navigation({
    "课程概览": [page_intro],
    
    "分类模型": [
        page_logistic, page_bayes, page_svm,
        page_tree, page_bagging, page_rf
    ],
    
    "回归与优化": [
        page_lin_ols, page_lin_grad, page_lin_reg
    ],
    
    "统计推断与采样": [
        page_em,
        page_mcmc
    ]
})

pg.run()