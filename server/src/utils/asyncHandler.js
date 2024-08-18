const asyncHandler=(fn)=>async (req,res,next)=>{
    try{
        await fn(req,res,next);
    }catch(err){
      // console.error(err);
        res.status(err.code||500).json({
            message:err.message||'An unknown error occurred!',
            success:false
        });

        next(err);
    }
}
// const asyncHandler = (requestHandler) => {
//   return (req, res, next) => {
//     Promise.resolve(requestHandler(req, res, next)).catch((err) => {
//       console.error(err); // Log the error message to the terminal
//       next(err); // Pass the error to the next middleware
//     });
//   };
// };

export default asyncHandler;

