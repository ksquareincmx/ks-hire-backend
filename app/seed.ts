import * as uuid from "uuid";
require("dotenv").config();

import { setupDB } from "./db";
import { Candidate, CandidateUtils } from "./models/Candidate";
import { CandidateJob } from "./models/CandidateJob";
// import { Cities } from "./models/Cities";
// import { Countries } from "./models/Countries";
import { Department } from "./models/Department";
import { Feedback } from "./models/Feedback";
import { Job, JobUtils } from "./models/Job";
import { log } from "./libraries/Log";
import { Notes } from "./models/Notes";
import {
  ProcessInterview,
  ProcessInterviewUtils,
} from "./models/ProcessInterview";
import { Role } from "./models/Role";
import { Stage } from "./models/Stage";
// import { States } from "./models/States";
import { User } from "./models/User";
import LEVEL_PERMISSION from "./utils/LevelPermissions";

// import * as countries from "./locales/countries.json";
// import * as states from "./locales/states.json";
// import * as cities from "./locales/cities.json";

async function seed(): Promise<any> {
  // Do your seed code here, should return a promise that resolves whenn you are done.

  // Creates first admin user
  const count = await User.count();
  if (count === 0) {
    await Role.create({
      level: LEVEL_PERMISSION.ADMINISTRATOR,
      description: "KS Hire Administrator",
    });
    await Role.create({
      level: LEVEL_PERMISSION.RECRUITER,
      description: "KS Hire Recruiter",
    });
    await Role.create({
      level: LEVEL_PERMISSION.INTERVIEWER,
      description: "KS Hire Interviewer",
    });
    await Role.create({
      level: LEVEL_PERMISSION.MANAGER,
      description: "KS Hire Manager",
    });
    await Stage.create({
      id: 1,
      name: "PROSPECTIVE",
      details: "A new candidate we have not gotten in touch with",
    });
    await Stage.create({
      id: 2,
      name: "ACTIVE",
      details: "A candidate that is currently in a recruitment process",
    });
    await Stage.create({
      id: 3,
      name: "HIRED",
      details: "A candidate that has been hired",
    });
    await Stage.create({
      id: 4,
      name: "REJECTED",
      details: "A candidate that has been rejected",
    });
    await Department.create({
      id: 1,
      name: "HR",
      jobsCount: 0,
    });
    await Department.create({
      id: 2,
      name: "KSQU",
      jobsCount: 0,
    });
    await Department.create({
      id: 3,
      name: "Marketing",
      jobsCount: 0,
    });
    await Department.create({
      id: 4,
      name: "Operations",
      jobsCount: 0,
    });
    await Department.create({
      id: 5,
      name: "Project Management",
      jobsCount: 0,
    });
    await Department.create({
      id: 6,
      name: "Technology",
      jobsCount: 0,
    });
    await Department.create({
      id: 7,
      name: "UX",
      jobsCount: 0,
    });

    const user1 = await User.create({
      id: uuid(),
      firstName: "John",
      lastName: "Doe",
      email: "admin@example.com",
      roleId: 1,
    });

    const user2 = await User.create({
      id: uuid(),
      firstName: "Jane",
      lastName: "Doe",
      email: "recruiter@example.com",
      roleId: 2,
    });

    const user3 = await User.create({
      id: uuid(),
      firstName: "Pedro",
      lastName: "Pérez",
      email: "interviewer@example.com",
      roleId: 3,
    });

    const user4 = await User.create({
      id: uuid(),
      firstName: "Juan",
      lastName: "López",
      email: "manager@example.com",
      roleId: 4,
    });

    const job1 = await Job.create({
      id: uuid(),
      title: "JavaScript Developer",
      clientJobId: "Client1243",
      clientName: "Client",
      departmentId: 6,
      details: "We're hiring Jr. JavaScript developers",
      isJobRemote: true,
      jobSeniority: "SWE I",
      jobTime: "Full-time",
      jobType: "Temporal",
      jobUrgency: "Low",
      location: "Mérida, Yucatán, México",
      salaryCurrency: "MXN",
      salaryGross: "Gross",
      salaryLower: "10000",
      salaryPeriod: "month",
      salaryPublic: true,
      salaryUpper: "30000",
      status: "Open",
      tags: "Merida, KS",
      userId: user1.id,
    });
    (job1 as JobUtils).setHiringManagers([user4]);
    const job2 = await Job.create({
      id: uuid(),
      title: "Java Developer",
      clientJobId: "Client1243",
      clientName: "Client",
      departmentId: 6,
      details: "We're hiring Jr. Java developers",
      isJobRemote: false,
      jobSeniority: "SWE I",
      jobTime: "Full-time",
      jobType: "Permanent",
      jobUrgency: "Low",
      location: "Mérida, Yucatán, México",
      salaryCurrency: "MXN",
      salaryGross: "Net",
      salaryLower: "10000",
      salaryPeriod: "month",
      salaryPublic: true,
      salaryUpper: "30000",
      status: "Open",
      tags: "Merida, KS",
      userId: user1.id,
    });
    (job2 as JobUtils).setHiringManagers([user4]);
    const candidate1 = await Candidate.create({
      id: uuid(),
      firstName: "Juan",
      lastName: "Relet",
      phone: "9999999999",
      email: "jrelvet@correo.com",
      website: "me.com",
      resume: "",
      source: "LinkedIn",
      linkedinProfile: "linkedin.com/juan-relet",
      referral: "Marco Polo",
      employer: "Ksquare",
      stageId: 1,
      jobId: job1.id,
    });
    (candidate1 as CandidateUtils).setUsers([user2]);
    const candidate2 = await Candidate.create({
      id: uuid(),
      firstName: "Rebeca",
      lastName: "Gill",
      phone: "9999999999",
      email: "rebecag@correo.com",
      website: "me.com",
      resume: "",
      source: "Website",
      linkedinProfile: "linkedin.com/rebeca-gill",
      referral: "Cleo Patra",
      employer: "Ksquare",
      stageId: 3,
      jobId: job2.id,
    });
    (candidate2 as CandidateUtils).setUsers([user2]);
    await Feedback.create({
      id: uuid(),
      comment: "He seems to be a MID-level developer",
      score: 2,
      userId: user1.id,
      candidateId: candidate1.id,
    });
    await Feedback.create({
      id: uuid(),
      comment: "She seems to be a MID-level developer",
      score: 2,
      userId: user1.id,
      candidateId: candidate2.id,
    });
    await Notes.create({
      id: uuid(),
      note: "He has a positive attitude",
      userId: user1.id,
      candidateId: candidate1.id,
    });
    await Notes.create({
      id: uuid(),
      note: "She has a positive attitude",
      userId: user1.id,
      candidateId: candidate2.id,
    });
    await CandidateJob.create({
      candidateId: candidate1.id,
      jobId: job1.id,
    });
    await CandidateJob.create({
      candidateId: candidate2.id,
      jobId: job2.id,
    });
    // candidate 1
    const processInterview1 = await ProcessInterview.create({
      id: uuid(),
      label: "First Contact",
      candidateId: candidate1.id,
    });
    (processInterview1 as ProcessInterviewUtils).setUsers([user1, user3]);
    const processInterview2 = await ProcessInterview.create({
      id: uuid(),
      label: "Technical 1",
      candidateId: candidate1.id,
    });
    (processInterview2 as ProcessInterviewUtils).setUsers([user1, user3]);
    const processInterview3 = await ProcessInterview.create({
      id: uuid(),
      label: "Technical 2",
      candidateId: candidate1.id,
    });
    (processInterview3 as ProcessInterviewUtils).setUsers([user1, user3]);

    // candidate2
    const processInterview4 = await ProcessInterview.create({
      id: uuid(),
      label: "First Contact",
      candidateId: candidate2.id,
    });
    (processInterview4 as ProcessInterviewUtils).setUsers([user2, user4]);
    const processInterview5 = await ProcessInterview.create({
      id: uuid(),
      label: "Technical 1",
      candidateId: candidate2.id,
    });
    (processInterview5 as ProcessInterviewUtils).setUsers([user2, user4]);
    const processInterview6 = await ProcessInterview.create({
      id: uuid(),
      label: "Technical 2",
      candidateId: candidate2.id,
    });
    (processInterview6 as ProcessInterviewUtils).setUsers([user2, user4]);

    // for (let i = 0; i < countries.length; i++) {
    //   await Countries.create(countries[i]);
    // }

    // for (let i = 0; i < states.length; i++) {
    //   await States.create(states[i]);
    // }

    // for (let i = 0; i < cities.length; i++) {
    //   await Cities.create(cities[i]);
    //}
  }
}

setupDB()
  .then(() => {
    return seed();
  })
  .then(() => {
    log.info("SEED DONE");
    process.exit();
  })
  .catch((err) => {
    log.error("ERROR EXECUTING SEED:", err);
    process.exit();
  });
