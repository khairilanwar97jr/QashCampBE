const repo = require("../repositories/momentsRepo");
const cloudinaryService = require("./cloudinaryService");

const getTimeline = async () => {
  return repo.getAllApproved();
};

const getAdminMoments = async () => {
  return repo.getAll();
};

// ✅ Upload → then save URL
const submitMoment = async (caption, imagePath, userId) => {
  const imageUrl = await cloudinaryService.uploadImage(imagePath, "moments");

  return repo.create({
    caption,
    imageUrl,
    userId,
  });
};

const approveMoment = async (id) => {
  return repo.approve(id);
};

const rejectMoment = async (id) => {
  return repo.reject(id);
};

module.exports = {
  getTimeline,
  getAdminMoments,
  submitMoment,
  approveMoment,
  rejectMoment,
};
