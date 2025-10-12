const backendDomain = "http://localhost:8080"


const summaryApi = {
    signUp: {
        url: `${backendDomain}/api/user/register`,
        method: "post"
    },
    signIn : {
        url: `${backendDomain}/api/user/login`,
        method: 'post'
    },
    googleLogin: {
        url: `${backendDomain}/api/user/google-login`,
        method: 'post'
    },
    availableDate:{
        url: `${backendDomain}/api/user/demo-scheduling`,
    },
    availableTime:{
        url: `${backendDomain}/api/user/demo-scheduling`,
    },
    demoSchedule:{
        url: `${backendDomain}/api/user/demo-scheduling`,
        method: 'post'
    },


      
} 

export default summaryApi