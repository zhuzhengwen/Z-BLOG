import Vue  from 'vue'
import Vuex from 'vuex'
import api  from '../utils/api.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    posts:      [],
    hasMore:    true,
    page:       1,
    category:   null,
    repoInfo:   null,
  },
  mutations: {
    SET_POSTS(state, { posts, append }) {
      state.posts = append ? [...state.posts, ...posts] : posts
    },
    SET_HAS_MORE(state, v)   { state.hasMore = v },
    SET_PAGE(state, v)       { state.page = v },
    SET_CATEGORY(state, v)   { state.category = v; state.page = 1; state.posts = []; state.hasMore = true },
    SET_REPO_INFO(state, v)  { state.repoInfo = v },
  },
  actions: {
    async loadPosts({ state, commit }, { append = false } = {}) {
      const issues = await api.getIssues({
        page:     state.page,
        perPage:  10,
        label:    state.category,
      })
      commit('SET_POSTS', { posts: issues, append })
      commit('SET_HAS_MORE', issues.length >= 10)
      return issues
    },
    async loadMore({ state, commit, dispatch }) {
      if (!state.hasMore) return
      commit('SET_PAGE', state.page + 1)
      await dispatch('loadPosts', { append: true })
    },
    async loadRepoInfo({ state, commit }) {
      if (state.repoInfo) return state.repoInfo
      const info = await api.getRepoInfo()
      commit('SET_REPO_INFO', info)
      return info
    },
  },
})
