const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwtUtils = require("jsonwebtoken");
const interceptor = require("./middleware/jwt-interceptor");

//Notre application
const app = express();

// Configuration de la base de données
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "project-angular-dw2",
});

// Connexion à la base de données
connection.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données :", err);
    return;
  }
  console.log("Connecté à la base de données MySQL");
});

app.use(cors());

app.use(express.json());

app.get("/", (requete, resultat) => { 
  resultat.send("<h1>C'est une API il y a rien à voir ici</h1>");
});

app.get("/materiel/list", interceptor, (requete, resultat) => {

  connection.query("SELECT * FROM materiel", (err, lignes) => {
    if (err) {
      console.error(err);
      return resultat.sendStatus(500); //envoyer une erreur au client
    }
    return resultat.json(lignes);
  });
});

app.get("/materiel/:id", (requete, resultat)=> {
  connection.query("SELECT * FROM materiel WHERE id_materiel = ?", [requete.params.id], (err, lignes) =>{
    if (err) {
      console.error(err);
      return resultat.sendStatus(500); //envoyer une erreur au client
    }
    //si id du produit est inconnu
    if (lignes.length == 0) {
      return resultat.sendStatus(404);
    }
    return resultat.json(lignes[0]);
  })
})

app.put("/materiel/:id", interceptor, (requete, resultat) => {
  const materiel = requete.body;
  materiel.id = requete.params.id;

  if(requete.user.role != "vendeur" && requete.user.role != "administrateur"){
    return resultat.sendStatus(403);
  }
  //validation
  if (materiel.nom == null || 
    materiel.nom == "" || 
    materiel.nom.length > 20 || 
    materiel.description.length > 50) {
    
    return resultat.sendStatus(400); //bad request
  }
    //verification si le nom du produit existe déjà
    connection.query(
    "SELECT * FROM materiel WHERE name_materiel = ? AND id_materiel != ?", [materiel.nom, materiel.id], (err, lignes) => {
      if (lignes.length > 0) {
        return resultat.sendStatus(409);//conflict
      }
      connection.query(
        "UPDATE materiel SET name_materiel = ?, description_materiel = ? WHERE id_materiel = ?",
        [materiel.nom, materiel.description, materiel.id],
        (err, lignes) => {
          if (err) {
            console.log(err);
            return resultat.sendStatus(500); //internal server error
          }
          // resultat.json(produit).sendStatus(201);
          return resultat.status(200).json(materiel) // ok
        }
      )
    })
})

app.post("/materiel", interceptor,  (requete, resultat) => {

  const materiel = requete.body;

  if(requete.user.role != "vendeur" && requete.user.role != "administrateur"){
    return resultat.sendStatus(403);
  }

  //validation
  if (materiel.nom == null || materiel.nom == "" || produit.nom.length > 20 || produit.description.length > 50) {
    return resultat.sendStatus(400); //bad request
  }

  //verification si le nom du produit existe déjà
  connection.query(
    "SELECT * FROM materiel WHERE name_materiel = ?", [produit.nom], (err, lignes) => {
      if (lignes.length > 0) {
        return resultat.sendStatus(409);//conflict
      }
      connection.query(
        "INSERT INTO materiel (name_materiel, description_materiel, id_createur) VALUE(?,?,?)",
        [produit.nom, produit.description, requete.user.id],
        (err, lignes) => {
          if (err) {
            console.log(err);
            return resultat.sendStatus(500); //internal server error
          }
          // resultat.json(produit).sendStatus(201);
          resultat.status(201).json(produit) //created (fonctionne, ajout du produit)
        }
      )
    });
})

app.delete("/materiel/:id", interceptor, (requete, resultat) =>{
  // on récupère le produit
  connection.query("SELECT * FROM materiel WHERE id_materiel = ?", [requete.params.id], (err, lignes) => {
    // si il y a une erreur
    if (err){
      console.log(err);
      return resultat.sendStatus(500);//internal server error
    }
    // si l'id du produit est inconnu
    if (lignes.length == 0) {
      return resultat.sendStatus(404);
    }
    // on vérifie si l'user connecté est le propriétaire 
    const estProprietaire = requete.user.role == "vendeur" && requete.user.id == lignes[0].id_createur;

    // si il n'est ni proprietaire du produit ni admin
    if(!estProprietaire && requete.user.role != "administrateur"){
      return resultat.sendStatus(403);
    }
    // on supprime le produit
    connection.query("DELETE FROM materiel WHERE id_materiel = ?", [requete.params.id], (erreur, lignes) => {
      if (erreur){
        console.log(erreur);
        return resultat.sendStatus(500);//internal server error
      }
      // 204 = no-content = tout c'est bien passé, mais il n(y a rien dans le corp de la réponse)
      return resultat.sendStatus(204);
    });
  });
})

app.post("/inscription",(requete, resultat)=> {
  const utilisateur= requete.body;
  // console.log(utilisateur);

  const passwordHash = bcrypt.hashSync(utilisateur.password, 10);
  connection.query("INSERT INTO utilisateur(email, password) VALUES (?,?)", [
    utilisateur.email, passwordHash], 
    (err, retour) => {
    if (err && err.code == "ER_DUP_ENTRY"){
      return resultat.sendStatus(409); //conflit
    }

    if (err){
      console.log(err);
      return resultat.sendStatus(500);//internal server error
    }

    utilisateur.id = retour.insertId;
    resultat.json(utilisateur);
  })
})

app.post("/connexion", (requete, resultat) => {
  connection.query("SELECT u.id, u.email, u.password, r.nom FROM utilisateur u JOIN role r on u.role_id = r.id WHERE email = ?",
    [requete.body.email],
    (erreur, lignes) => {
      if (erreur){
        console.log(err);
        return resultat.sendStatus(500); //internal server error
      }
      //si email est inexistant
      if (lignes.length === 0) {
        return resultat.sendStatus(401);
      }
      const motDePasseFormulaire = requete.body.password;
      const motDePasseHashBaseDeDonnees = lignes[0].password;
      
      const compatible = bcrypt.compareSync(
        motDePasseFormulaire, motDePasseHashBaseDeDonnees
      );
      if (!compatible){
        return resultat.sendStatus(401);
      }
      return resultat.send(jwtUtils.sign({sub: requete.body.email, role: lignes[0].nom, id: lignes[0].id }, "azerty123"));
    }
  );
})

//démarrer le serveur 
app.listen(5000, () => console.log("Le serveur écoute sur le port 5000 !!")); //port, function;
