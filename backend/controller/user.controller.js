import User from '../models/user.model.js';

export const getUsers= async(req,res,next)=> {

try{
 const page = Math.max(parseInt(req.query.page) || 1, 1);
 const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
 const skip = (page - 1) * limit;
 const search = req.query.search || '';

 // Build filter
 const filter = {};
 if (search) {
   filter.$or = [
     { name: { $regex: search, $options: 'i' } },
     { email: { $regex: search, $options: 'i' } },
   ];
 }

 const [users, totalCount] = await Promise.all([
   User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
   User.countDocuments(filter),
 ]);

 const totalPages = Math.ceil(totalCount / limit);

 res.status(200).json({
    success:true,
    totalCount,
    page,
    totalPages,
    limit,
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

// Flag or unflag a user account
export const flagUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isFlagged, flagReason } = req.body;

        if (typeof isFlagged !== 'boolean') {
            const error = new Error('isFlagged (boolean) is required');
            error.statusCode = 400;
            throw error;
        }

        const updateData = {
            isFlagged,
            flagReason: isFlagged ? (flagReason || 'Terms & conditions violation') : '',
            flaggedAt: isFlagged ? new Date() : null,
        };

        const user = await User.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!user) {
            const error = new Error('No user found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            message: isFlagged ? 'User account flagged successfully' : 'User account unflagged successfully',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};