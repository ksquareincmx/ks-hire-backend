# Framework

This app uses the following technologies:

- [Typescript](https://www.typescriptlang.org/docs/tutorial.html)
- [Express](http://expressjs.com/en/4x/api.html)
- [Sequelize](http://docs.sequelizejs.com/en/latest/api/sequelize/)

It is recommended to have basic knowledge of those technologies before working with this project.

## Project structure

- **app:** Project code
- **dist:** Compiled code for production
- **docs:** This documentation
- **public:** Public files to be served by this app
- **migrations:** Database migration files
- **gulpfile.js:** Compilation and project management scripts
- **tsconfig.json:** Typescript compiler configuration
- **package.json:** npm project configuration

#### App structure

- **config:** Global configuration for the app
- **controllers:** HTTP API controllers
- **models:** DB models
- **policies:** Access control and permission functions to be used in controllers
- **services:** Services that run independently to the API or can be used by it
- **libraries:** Base libraries for the project
- **db.ts:** Database initialization
- **server.ts:** Server initialization
- **routes.ts:** Routes definition. This file automatically loads the routes from the API in `controllers` and serves public files from `../public`
- **main.ts:** Application starting point, useful for initializing the services, specially for those that require to be started with a certain order
- **declarations.d.ts:** Special Typescript declarations for the project

## API Models

### Model files

- Models are defined in `app/models`.
- The file name must be the model name in singular with the first letter in uppercase. (PascalCase)
- The module must export a class that extends Model from 'sequelize-typescript'.

### Model definition

- The name of the table for the model must be in singular and lower case.
- The model definition follows the 'sequelize-typescript' style: [documentation](https://github.com/RobinBuschmann/sequelize-typescript).

Models and associations will be automatically loaded on app startup, it is only needed to import the model where required.

Example:

```js
import { Table, Column, DataType, BelongsTo, Model, ForeignKey } from "sequelize-typescript";
import { User } from "./User";

@Table({
  tableName: "profile"
})
export class Profile extends Model<Profile> {
  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null
  })
  timeZone: string;

  @Column({
    type: DataType.ENUM("en", "es"),
    allowNull: true
  })
  locale: "en" | "es";

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;
}
```

## API Controllers

### Controller files

- The controller files go into `app/controllers/v1`.
- The file name must be the controller name in singular with the first letter in uppercase. (PascalCase)
- The module must export a constant instance of the controller as `default`.

### Controller definition

- The controller must be a class that extends `Controller`.
- In the controller `this.name` must be defined (name that will be part of the controller route).
- In the constructor, the model associated with the controller must be assigned to `this.model`.
- The method `routes(): Router` must be defined assigning the routes to the controller routes, along with the desired "policies".

> Check out the `Controller` class definition for examples on how to define the `routes` function and other useful controller implementations.

Example:

```js
import { Controller } from "./../../libraries/Controller";
import { User } from "./../../models/User";

class UserController extends Controller {
  constructor() {
    super();
    this.name = "user";
    this.model = User;
  }

  routes(): Router {
    // Example routes
    // WARNING: Routes without policies
    // You should add policies before your method
    this.router.get("/", (req, res) => this.find(req, res));
    this.router.get("/:id", (req, res) => this.findOne(req, res));
    this.router.post("/", (req, res) => this.create(req, res));
    this.router.put("/:id", (req, res) => this.update(req, res));
    this.router.delete("/:id", (req, res) => this.destroy(req, res));

    return this.router;
  }
}

const controller = new UserController();
export default controller;
```

### Default Controller Rest API

- GET `/api/v2/<modelName>`: Gets a list of all the items of the model (JSON Array). The total number of objects is at the http header "Content-Count".
- GET `/api/v2/<modelName>/<id>`: Gets a item of the model (JSON)
- POST `/api/v2/<modelName>`: Creates a new item of the model (Expects JSON in body, returns JSON)
- PUT `/api/v2/<modelName>/<id>`: Modifies a preexisting item of the model (Expects JSON in body, returns JSON)
- DELETE `api/v2/<modelName>/<id>`: Removes a preexisting item of the model (HTTP 204)

#### Query params

- **where**: Accepts JSON following Sequelize's query format
- **limit**: number, max number of results to get
- **offset** | **skip**: number, offset for the results to get, useful for pagination
- **order** | **sort**: string or an Array of Arrays, specifying ordering for the results, format: `<column name> <ASC | DESC>` or `[["<column name>", "<ASC | DESC>"], ...]`
- **include**: JSON(Array< Object | string >): Specify the relations to populate, the members of the array can be strings with the name of the model to populate, the name with a dot and a filter name, or a object with a key of the same format as before that denotes an array with the same format of the parent one (recursive). Example:

  ```
  include=["Profile", {"Children.ordered": ["ChildrenProfile"]}]
  ```

**Example:**

```
GET http://example.com/api/v1/user?where={"name":{"$like":"Alfred"}}&limit=10&offset=20&include=["Profile"]&order=[["lastName", "ASC"]]
```
