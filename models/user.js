import database from "infra/database.js";
import password from "models/password.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);

  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
      SELECT
        * 
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT 
        1
      ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Usuário não encontrado.",
        action: "Verifique se o apelido informado está correto.",
      });
    }

    return results.rows[0];
  }
}

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);

  return userFound;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
      SELECT
        * 
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      LIMIT 
        1
      ;`,
      values: [email],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Usuário não encontrado.",
        action: "Verifique se o email informado está correto.",
      });
    }

    return results.rows[0];
  }
}

async function create(userInputValues) {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: `
      INSERT INTO 
        users (username, email, password) 
      VALUES 
        ($1, $2, $3)
      RETURNING
        *
      ;`,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });
    return results.rows[0];
  }
}

async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);
  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }
  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }
  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userWithUpdatedValues = { ...currentUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(userWithUpdatedValues);
  return updatedUser;

  async function runUpdateQuery(userWithUpdatedValues) {
    const results = await database.query({
      text: `
      UPDATE 
        users 
      SET 
        username = $1, 
        email = $2, 
        password = $3,
        updated_at = timezone('utc', now())
      WHERE
        id = $4
      RETURNING
        *
      ;`,
      values: [
        userWithUpdatedValues.username,
        userWithUpdatedValues.email,
        userWithUpdatedValues.password,
        userWithUpdatedValues.id,
      ],
    });
    return results.rows[0];
  }
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
      SELECT
        email 
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      ;`,
    values: [email],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "E-mail informado já está cadastrado.",
      action: "Utilize outro e-mail.",
    });
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
      SELECT
        username 
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      ;`,
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "Apelido informado já está cadastrado.",
      action: "Utilize outro apelido.",
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

const user = {
  create,
  findOneByUsername,
  findOneByEmail,
  update,
};

export default user;
