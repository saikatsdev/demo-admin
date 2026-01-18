import api from '../index';


export const getDatas = async (url, params) => {
  try {
    const response = await api.get(url, {params})
    return response.data
  } catch (error) {
    console.error("API error:", error);

    if (!error.response) {
      return {
        success: false,
        message: "Network error or CORS issue. Please check your API server.",
      };
    }

    return error.response.data
  }
}

export const postData = async (url, data, config = {}) => {
  try {
    const response = await api.post(url, data, config)
    return response.data
  } catch (error) {
    console.error("API error:", error);

    if (!error.response) {
      return {
        success: false,
        message: "Network error or CORS issue. Please check your API server.",
      };
    }
    
    return error.response?.data
  }
}

export const putData = async (url, data, config = {}) => {
  try {
    const response = await api.put(url, data, config)
    return response.data
  } catch (error) {
    return error.response?.data
  }
}

export const deleteData = async (url, config = {}) => {
  try {
    const response = await api.delete(url, config)
    return response.data
  } catch (error) {
    return error.response?.data
  }
}