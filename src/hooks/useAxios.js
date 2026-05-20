import { useEffect } from 'react'
import api from '../api'
import { useAuth } from './useAuth'

const useAxios = () => {
    const { token } = useAuth()

    useEffect(() => {
        const requestInterceptor = api.interceptors.request.use(
            (config) => {
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        )

        const responseInterceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                const originalRequest = error?.config ?? {}
                if (error?.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true
                }
                return Promise.reject(error)
            }
        )

        return () => {
            api.interceptors.request.eject(requestInterceptor)
            api.interceptors.response.eject(responseInterceptor)
        }
    }, [token])

    return api
}

export default useAxios



