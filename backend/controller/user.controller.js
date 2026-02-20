import User from '../models/user.model.js';

export const getUsers= async(req,res,next)=> {

try{
 const users =await User.find().select("-password")
 if(!users){
    const error = new Error("No users found")
    error.statusCode= 404
    throw error
 }
 res.status(200).json({
    success:true,    
    data:users
 })
}catch(error){
    next(error)
}
}
export const getUser= async(req,res,next)=> {

try{
 const user =await User.findById(req.params.id).select("-password")
 if(!user){
    const error = new Error("No user found")
    error.statusCode= 404
    throw error
 }
 res.status(200).json({
    success:true,    
    data:user
 })
}catch(error){
    next(error)
}
}



export const updateUser = async(req,res,next)=> {
   try{
         const user = await User.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true})
         if(!user){
            const error = new Error("No user found")
            error.statusCode= 404
            throw error
         }
         res.status(200).json({
            success:true,    
            data:user
         })
   } catch(e){
      next(e)
   }
}

export const deleteUser = async(req,res,next)=> {
   try{
       const user = await User.findByIdAndDelete(req.params.id)
   if(!user){
      const error = new Error("No user found")
      error.statusCode= 404
      throw error
   }  
   res.status(200).json({
      success:true,    
      message:"User deleted successfully"
   })
   } catch(err){
      next(err)
   }
}