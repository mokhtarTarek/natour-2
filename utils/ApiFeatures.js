class APIfeatures {
    //the queryString is coming from the req.query object
    //the query will will store the result of the queryString
    constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
    }
  
    filter() {
      // 1) PREPARE THE QUERY
      const queryObj = { ...this.queryString };
      const excludFields = ['sort', 'page', 'limit', 'fields'];
      excludFields.forEach((el) => delete queryObj[el]);
  
      // 2) ADVANCED FILTERING
      let queryStr = JSON.stringify(queryObj); //TO PERFORM STRING REPLACE METHOD
      queryStr = queryStr.replace(/\b(lt|lte|gt|gte)\b/g, (match) => `$${match}`);
  
      // STORING THE QUERY RESULT
      this.query = this.query.find(JSON.parse(queryStr)); //THE QUERY TAKE OBJ AS ARGUMENT
      return this;
    }
  
    limit() {
      if (this.queryString.fields) {
        const fieldsName = this.queryString.fields.split(',').join(' ');
        console.log(fieldsName);
        this.query = this.query.select(fieldsName);
      } else {
        this.query = this.query.select('-__v');
      }
      return this;
    }
  
    sort() {
      if (this.queryString.sort) {
        const sortBy = this.queryString.sort.split(',').join(' '); //the val of prop is a string
        this.query = this.query.sort(sortBy);
      } else {
        this.query = this.query.sort('-createdAt');
      }
      return this;
    }
  
    paginate() {
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 100;
      const skip = (page - 1) * limit;
      this.query = this.query.skip(skip).limit(limit);
      return this;
    }
  }
  module.exports = APIfeatures;