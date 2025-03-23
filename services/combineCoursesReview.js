// Importing required modules
const ReviewModel = require("../models/ReviewModel");
const EntrollModel = require("../models/EnrollModel");
const LessonModel = require("../models/LessonModel");

// Function to combine course data with reviews
async function combineCoursesReview(courses, userId) {

    // Fetch all reviews from the database
    const reviews = await ReviewModel.find({ isPublish: true }, { isPublish: 0 }).populate("userId", "firstname lastname avatar");

    const updatedCoursesData = await Promise.all(courses.map(async (course) => {

        const courseId = course._id;

        // Find reviews matching the courseId
        const matchingReviews = reviews.filter(review => review.courseId.equals(courseId));

        // Calculate rating statistics
        const ratingCounts = { 'one': 0, 'two': 0, 'three': 0, 'four': 0, 'five': 0 };
        let totalRating = 0;

        matchingReviews.forEach(review => {
            const rating = Math.floor(review.rating);
            const ratingKey = ['one', 'two', 'three', 'four', 'five'][rating - 1];
            if (ratingKey) {
                ratingCounts[ratingKey]++;
                totalRating += review.rating;
            }
        });

        // Calculate average rating
        const averageRating = matchingReviews.length > 0 ? totalRating / matchingReviews.length : 0;

        // Fetch lessons count for the course
        const lessonsCount = await LessonModel.countDocuments({ courseId: course._id });

        const isEnrolled = await EntrollModel.exists({ userId: userId, courseId: course._id });

        return {
            ...course.toObject(),
            is_buy: isEnrolled ? 1 : 0,
            totalLessons: lessonsCount,
            ratingCounts,
            totalRating,
            averageRating,
            reviews: matchingReviews
        };

    }));

    return updatedCoursesData;
}

module.exports = combineCoursesReview;
