import { Router, Request, Response } from "express";
import { Controller } from "../../libraries/Controller";
import { Countries } from "../../models/Countries";
import { States } from "../../models/States";
import { Cities } from "../../models/Cities";
export class LocationController extends Controller {
  constructor() {
    super();
    this.name = "location";
  }

  routes(): Router {
    this.router.get("/countries", (req, res) => this.countries(req, res));
    this.router.get("/states/:countryId", (req, res) => this.states(req, res));
    this.router.get("/cities/:stateId", (req, res) => this.cities(req, res));
    return this.router;
  }

  async countries(req: Request, res: Response) {
    try {
      const countries = await Countries.findAll();
      return res.status(201).json(countries);
    } catch (error) {
      console.log(error);
      Controller.serverError(res);
    }
  }

  async states(req: Request, res: Response) {
    try {
      const states = await States.findAll({
        order: [["name", "ASC"]],
        where: {
          country_id: req.params.countryId,
        },
      });
      return res.status(201).json(states);
    } catch (error) {
      console.log(error);
      Controller.serverError(res);
    }
  }

  async cities(req: Request, res: Response) {
    try {
      const cities = await Cities.findAll({
        order: [["name", "ASC"]],
        where: {
          state_id: req.params.stateId,
        },
      });
      return res.status(201).json(cities);
    } catch (error) {
      console.log(error);
      Controller.serverError(res);
    }
  }
}

const location = new LocationController();
export default location;
