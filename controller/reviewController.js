const bookModel = require('../model/bookModel')

const reviewModel = require('../model/reviewModel')

const moment = require('moment')

const { isValidObjectId } = require('mongoose')


//>---------------------------------- VALIDATION FUNCTION---------------------------------------<//

const validation = require('../validation/validation')

let { isValidName, isEmpty } = validation


//>------------------------------------------ CREATING REVIEW ------------------------------------------<//

exports.review = async (req, res) => {

    try {

        let bodyData = req.body
        
        let { bookId, reviewedBy, reviewedAt, rating, review, isDeleted, ...rest } = bodyData

        if (Object.keys(bodyData).length == 0) {
            return res.status(400).send({ status: false, message: "Please Provide data in the body." })
        }

        if (Object.keys(rest).length != 0) {
            return res.status(400).send({ status: false, message: "Not allowed to add extra attributes." })
        }


        const BookId = req.params.bookId

        // if (!BookId) {
        //     return res.status(400).send({ status: false, message: "Please provide BookId in params." })
        // }

        if (!isValidObjectId(BookId)) {
            return res.status(400).send({ status: false, message: "Please provide a valid BookId." })
        }

        bodyData.bookId = BookId

        bodyData.reviewedAt = moment().format("dddd, MMMM Do YYYY, h:mm:ss")
        
        const findBook = await bookModel.findById(bodyData.bookId)

        if(!findBook){
            return res.status(404).send({status : false, message : "The book you want to review is not exist!"})
        }

        if(findBook.isDeleted == true){
            return res.status(400).send({status : false, message : "The book you want to review is deleted!"})
        }

        if(!reviewedBy){
            bodyData.reviewedBy = 'Guest'
        }

        if(!isEmpty(reviewedBy) ){
            bodyData.reviewedBy = 'Guest'
        }

        if (!isValidName(reviewedBy)) {
            bodyData.reviewedBy = 'Guest'
        }
        
        rating = rating.toString()

        if ( !rating || !review ) {
            return res.status(400).send({ status: false, message: "Please provide all attributes." })
        }

        // if ( rating == "" || review == "") {
        //     return res.status(400).send({ status: false, message: "Please provide all attributes value." })
        // }

        
        if (!isEmpty(rating) || !isEmpty(review)) {
            return res.status(400).send({ status: false, message: "Value must be given in all attributes." })
        }
        
        if (rating < 1 || rating > 5 ) {
            return res.status(400).send({ status: false, message: "Rating range should in between 1 to 5." })
        }

        let creatreview = await reviewModel.create(bodyData)

        let updateBookreview = await bookModel.findOneAndUpdate(
            { _id: BookId, isDeleted: false },
            { $inc: { reviews: 1 } },
            { new: true }
        )

        //  const reviewdetails = await reviewModel.find({bookId : BookId, isDeleted : false}).count()
        //  console.log(reviewdetails)

        let reviewData = {
            _id: creatreview._id,
            bookId: creatreview.bookId,
            reviewedBy: creatreview.reviewedBy,
            reviewedAt: creatreview.reviewedAt,
            rating: creatreview.rating,
            review: creatreview.review
        }

        const reviewDetail = {
            title : findBook.title,
            excerpt : findBook.excerpt,
            userId : findBook.userId,
            ISBN : findBook.ISBN,
            category : findBook.category,
            subcategory : findBook.subcategory,
            reviews : findBook.reviews + 1,
            reviewsData : reviewData
        }


        res.status(201).send({ status: true, message: "success", data: reviewDetail })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//>-------------------------------------------------------------------------------------------------------------<//


//>-------------------------------------------- UPDATE REVIEW -----------------------------------------<//

exports.updateReview = async (req, res) => {

    try {

        const bookId = req.params.bookId

        const reviewId = req.params.reviewId

        // if (!bookId) {
        //     return res.status(400).send({ status: false, message: "Please provide BookId in params." })
        // }

        // if (!reviewId) {
        //     return res.status(400).send({ status: false, message: "Please provide reviewId in params." })
        // }

        if (!isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Please provide a valid BookId." })
        }
        
        if (!isValidObjectId(reviewId)) {
            return res.status(400).send({ status: false, message: "Please provide a valid reviewId." })
        }

        const bookDetails = await bookModel.findById(bookId)
        if (!bookDetails) {
            return res.status(404).send({ status: false, message: "No book Found with this Id!" })
        }

        if (bookDetails.isDeleted == true) {
            return res.status(400).send({ status: false, message: "The book wIth this Id is already Deleted!" })
        }

        const reviewDetails = await reviewModel.findById(reviewId)
        if (!reviewDetails) {
            return res.status(404).send({ status: false, message: "No review Found with this Id!" })
        }

        if (reviewDetails.isDeleted == true) {
            return res.status(400).send({ status: false, message: "The review with this Id is already Deleted!" })
        }

        const bookIdfrmReview = reviewDetails.bookId

        if (bookIdfrmReview != bookId) {
            return res.status(400).send({ status: false, message: "This Book has no review." })
        }

        const bodyData = req.body

        if (Object.keys(bodyData).length == 0) {
            return res.status(400).send({ status: false, message: "Please Provide data in the body." })
        }
        let { reviewedBy, rating, review, ...rest } = bodyData

        rating = rating.toString()

        if (!reviewedBy || !rating || !review) {
            return res.status(400).send({ status: false, message: "Please provide all attributes." })
        }

        if (Object.keys(rest).length != 0) {
            return res.status(400).send({ status: false, message: "Not allowed to add extra attributes." })
        }

        if (!isEmpty(reviewedBy) || !isEmpty(rating) || !isEmpty(review)) {
            return res.status(400).send({ status: false, message: "Value must be given in all attributes." })
        }

        if (rating < 1 || rating > 5  ) {
            return res.status(400).send({ status: false, message: "Rating range should in between 1 to 5." })
        }


        const reviewupdate = await reviewModel.findOneAndUpdate(
            { _id: reviewId, bookId: bookId },
            { $set: { reviewedBy: reviewedBy, rating: rating, review: review } },
            { new: true }
        )

        let finalData = {
            title: bookDetails.title,
            excerpt: bookDetails.excerpt,
            userId: bookDetails.userId,
            category: bookDetails.category,
            subcategory: bookDetails.subcategory,
            isDeleted: false,
            reviews: bookDetails.reviews,
            reviewsData: reviewupdate
        }
        res.status(200).send({ status: true, msg: "updated", data: finalData })


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//>-----------------------------------------------------------------------------------------------------<//


//>--------------------------------------- DELETE REVIEW ------------------------------------------<//

exports.DeleteReview = async (req, res) => {

    try {
        
        const bookId = req.params.bookId

        const reviewId = req.params.reviewId

        // if (!bookId) {
        //     return res.status(400).send({ status: false, message: "Please provide BookId in params." })
        // }

        // if (!reviewId) {
        //     return res.status(400).send({ status: false, message: "Please provide reviewId in params." })
        // }

        if (!isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Please provide a valid BookId." })
        }
        
        if (!isValidObjectId(reviewId)) {
            return res.status(400).send({ status: false, message: "Please provide a valid reviewId." })
        }

        const bookDetails = await bookModel.findById(bookId)
        if (!bookDetails) {
            return res.status(404).send({ status: false, message: "No book Found with this Id!" })
        }

        if (bookDetails.isDeleted == true) {
            return res.status(400).send({ status: false, message: "The book wIth this Id is already Deleted!" })
        }

        const reviewDetails = await reviewModel.findById(reviewId)
        if (!reviewDetails) {
            return res.status(404).send({ status: false, message: "No review Found with this Id!" })
        }

        if (reviewDetails.isDeleted == true) {
            return res.status(400).send({ status: false, message: "The review wIth this Id is already Deleted!" })
        }

        const bookIdfrmReview = reviewDetails.bookId

        if (bookIdfrmReview != bookId) {
            return res.status(400).send({ status: false, message: "This Book has no review." })
        }

        const reviewDelete = await reviewModel.findOneAndUpdate(
            { _id: reviewId },
            { $set: { isDeleted: true } },
            { new: true }
        )

        let deleteBookreview = await bookModel.findOneAndUpdate(
            { _id: bookId, isDeleted: false },
            { $inc: { reviews: -1 } },
            { new: true }
        )
        return res.status(200).send({ status: true, message: "The review is successfully deleted.", data: reviewDelete })


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//>------------------------------------------------------------------------------------------------------------<//



















