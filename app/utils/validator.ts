import { body, validationResult } from "express-validator";
const nameValidator = /^[a-zA-ZàáèéìíòóùúüñÀÁÈÉÌÍÒÓÙÚÜ ,.'-/]+$/u;
const nameWithNumbersValidator = /^[a-zA-Z0-9àáèéìíòóùúüñÀÁÈÉÌÍÒÓÙÚÜ ,.'-/]+$/u;
const urlValidator = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/i;
const salary = /^[+-]?[0-9]{1,3}(?:[0-9]*(?:[.,][0-9]{2})?|(?:,[0-9]{3})*(?:\.[0-9]{2})?|(?:\.[0-9]{3})*(?:,[0-9]{2})?)$/;

//candidates
export const candidateValidationRules = () => {
  return [
    body("firstName").trim().notEmpty().matches(nameValidator),
    body("lastName").trim().notEmpty().matches(nameValidator),
    body("phone").trim().notEmpty().isNumeric(),
    body("email").trim().notEmpty().isEmail(),
    body("source").trim().notEmpty().matches(nameValidator),
    body("country").trim().notEmpty().isJSON(),
    body("state").trim().notEmpty().isJSON(),
    body("city").trim().notEmpty().isJSON(),
    body("referral")
      .trim()
      .optional({ checkFalsy: true })
      .matches(nameValidator),
    body("website").optional({ checkFalsy: true }).trim().matches(urlValidator),
    body("linkedin")
      .optional({ checkFalsy: true })
      .trim()
      .matches(urlValidator),
    body("jobId").trim().notEmpty(),
    body("stageId").trim().notEmpty().isNumeric(),
    body("salaryOffer").optional({ checkFalsy: true }).trim().matches(salary),
    body("recruiterId").optional({ checkFalsy: true }).trim().isUUID(),
    body("firstContact.*").trim().isUUID(),
    body("techInterview1.*").trim().isUUID(),
    body("techInterview2.*").trim().isUUID(),
  ];
};

export const editCandidateValidationRules = () => {
  return [
    body("firstName").trim().notEmpty().matches(nameValidator),
    body("lastName").trim().notEmpty().matches(nameValidator),
    body("phone").trim().notEmpty().isNumeric(),
    body("email").trim().notEmpty().isEmail(),
    body("source").trim().notEmpty().matches(nameValidator),
    body("country").trim().optional({ checkFalsy: true }).isJSON(),
    body("state").trim().optional({ checkFalsy: true }).isJSON(),
    body("city").trim().optional({ checkFalsy: true }).isJSON(),
    body("referral")
      .trim()
      .optional({ checkFalsy: true })
      .matches(nameValidator),
    body("website").optional({ checkFalsy: true }).trim().matches(urlValidator),
    body("linkedin")
      .optional({ checkFalsy: true })
      .trim()
      .matches(urlValidator),
    body("jobId").trim().notEmpty(),
    body("stageId").trim().notEmpty().isNumeric(),
    body("salaryOffer").optional({ checkFalsy: true }).trim().matches(salary),
    body("recruiterId").optional({ checkFalsy: true }).trim().isUUID(),
    body("firstContact.*").trim().isUUID(),
    body("techInterview1.*").trim().isUUID(),
    body("techInterview2.*").trim().isUUID(),
  ];
};

export const applicantValidationRules = () => {
  return [
    body("firstName").trim().notEmpty().matches(nameValidator),
    body("lastName").trim().notEmpty().matches(nameValidator),
    body("phone").trim().notEmpty().isNumeric(),
    body("email").trim().notEmpty().isEmail(),
    body("website").optional({ checkFalsy: true }).trim().matches(urlValidator),
    body("linkedin")
      .optional({ checkFalsy: true })
      .trim()
      .matches(urlValidator),
    body("country").trim().notEmpty().isJSON(),
    body("state").trim().notEmpty().isJSON(),
    body("city").trim().notEmpty().isJSON(),
  ];
};

//Job
export const jobValidationRules = () => {
  return [
    body("title").trim().notEmpty().matches(nameValidator),
    body("departmentId").trim().notEmpty().isNumeric(),
    body("requiredPositions").trim().optional({ checkFalsy: true }).isNumeric(),
    body("isJobRemote").isBoolean(),
    body("jobSeniority").trim().notEmpty().matches(nameValidator),
    body("jobTime").trim().notEmpty().matches(nameValidator),
    body("jobType").trim().notEmpty().isAlpha(),
    body("jobUrgency").trim().notEmpty().matches(nameValidator),
    body("location").trim().notEmpty().matches(nameValidator),
    body("salaryCurrency").trim().notEmpty().isAlpha(),
    body("salaryGross").trim().notEmpty().isAlpha(),
    body("salaryLower").trim().notEmpty().matches(salary),
    body("salaryPeriod").trim().notEmpty().isAlpha(),
    body("salaryPublic").isBoolean(),
    body("salaryUpper").trim().notEmpty().matches(salary),
    body("clientName")
      .optional({ checkFalsy: true })
      .trim()
      .matches(nameWithNumbersValidator),
    body("clientJobId")
      .optional({ checkFalsy: true })
      .trim()
      .matches(nameWithNumbersValidator),
    body("clientJobId")
      .optional({ checkFalsy: true })
      .trim()
      .matches(nameWithNumbersValidator),
    body("details").trim().notEmpty(),
    body("hiringManagers.*").trim().isUUID(),
    body("externalManager").isBoolean(),
  ];
};

// User

export const userValidationRules = () => {
  return [
    body("firstName").trim().notEmpty().matches(nameValidator),
    body("lastName").trim().notEmpty().matches(nameValidator),
    body("roleId").trim().notEmpty().isNumeric(),
  ];
};

//Feedbacks

export const feedbackValidationRules = () => {
  return [
    body("candidateId").notEmpty().isUUID(),
    body("score").trim().notEmpty().isNumeric(),
    body("comment").trim().notEmpty(),
  ];
};
export const editFeedbackValidationRules = () => {
  return [
    body("score").trim().notEmpty().isNumeric(),
    body("comment").trim().notEmpty(),
  ];
};

//NOTES

export const noteValidationRules = () => {
  return [
    body("candidateId").notEmpty().isUUID(),
    body("mentions.*").trim().isUUID(),
    body("note").trim().notEmpty(),
  ];
};

export const editNoteValidationRules = () => {
  return [body("note").trim().notEmpty()];
};

//NOTIFICATIONS
export const editNotificationValidationRules = () => {
  return [body("read").isBoolean()];
};

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(400).json({
    errors: extractedErrors,
  });
};
