// this function take an async function and return  a function reference 

module.exports = (fn) => {
  return (req, res, next) => {
    //since the fn is async we can catch the error and since the next() has a parameter
    //it will emmidiatly call the global function handler
    fn(req, res, next).catch((err) => next(err));
  };
};
