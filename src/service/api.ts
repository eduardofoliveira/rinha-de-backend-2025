import axios, { AxiosError, AxiosInstance } from 'axios'

// const url_default = 'http://payment-processor-default:8080'
// const url_fallback = 'http://payment-processor-fallback:8080'

// const url_default = process.env.PAYMENT_PROCESSOR_URL_DEFAULT || 'http://payment-processor-default:8080'
// const url_fallback = process.env.PAYMENT_PROCESSOR_URL_FALLBACK || 'http://payment-processor-fallback:8080'

const url_default = 'http://payment-processor-default:8080'
const url_fallback = 'http://payment-processor-fallback:8080'

const api = axios.create({
  baseURL: url_default,
})

const api_fallback = axios.create({
  baseURL: url_fallback,
})

// const MAX_RETRIES = 5

// api.interceptors.response.use(
//   response => response,
//   async error => {
//     const config = error.config
//     config.__retryCount = config.__retryCount || 0

//     if (error.response && error.response.status !== 200 && config.__retryCount < MAX_RETRIES) {
//       config.__retryCount += 1
//       try {
//         const fallbackResponse = await api_fallback.request({
//           ...config,
//           baseURL: url_fallback,
//         })
//         return {
//           data: fallbackResponse.data,
//           status: fallbackResponse.status,
//           server: 'fallback',
//         }
//       } catch (fallbackError) {
//         if (fallbackError instanceof AxiosError) {
//           return Promise.reject(fallbackError)
//         }
//       }
//     }
//     return Promise.reject(error)
//   },
// )

// api_fallback.interceptors.response.use(
//   response => response,
//   async error => {
//     const config = error.config
//     config.__retryCount = config.__retryCount || 0

//     if (error.response && error.response.status !== 200 && config.__retryCount < MAX_RETRIES) {
//       config.__retryCount += 1
//       try {
//         const fallbackResponse = await api.request({
//           ...config,
//           baseURL: url_fallback,
//         })
//         return {
//           data: fallbackResponse.data,
//           status: fallbackResponse.status,
//           server: 'default',
//         }
//       } catch (fallbackError) {
//         if (fallbackError instanceof AxiosError) {
//           return Promise.reject(fallbackError)
//         }
//       }
//     }
//     return Promise.reject(error)
//   },
// )

// export default api
export { api_fallback, api }