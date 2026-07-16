import axios from "axios"

const client = axios.create({
    baseURL: '/api',
    timeout: 30000,
})

client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config 
}, (error) => Promise.reject(error))

client.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err.response?.status
        const url = err.config?.url ?? ''

        const isAuthRoute = url.includes('/auth/')
        const isMeRoute = url.includes('/students/') || url.includes('/recruiters')


        if(status == 401 && (isAuthRoute || isMeRoute)) {
            localStorage.clear()
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)
export default client