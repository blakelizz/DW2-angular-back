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

//ajouter fonctionnalité
app.use(express.json()); //permet d'envoyer et recevoir du JSON (via les en-tête content-type et accept-content)

//app.use()

app.get("/", (requete, resultat) => { // "/" = définit la route de la page, (requ, res)
  resultat.send("<h1>C'est une API il y a rien à voir ici</h1>");
});

app.get("/materiel/list", interceptor, (requete, resultat) => {

  connection.query("SELECT * FROM materiel", (err, lignes) => {  //reequte , function callback
    //En cas d'erreur SQL ou d'interuption avec la db
    if (err) {
      console.error(err);
      return resultat.sendStatus(500); //envoyer une erreur au client
    }
    return resultat.json(lignes);
  });
});

app.get("/produit/:id", (requete, resultat)=> {
  connection.query("SELECT * FROM produit WHERE id =?", [requete.params.id], (err, lignes) =>{
    if (err) {
      console.error(err);
      return resultat.sendStatus(500); //envoyer une erreur au client
    }
    //si id du produit est inconnu
    if (lignes.length == 0) {
      return resultat.sendStatus(404);
    }
  })
})

app.post("/produit", interceptor,  (requete, resultat) => {

  const produit = requete.body;

  if(requete.user.role != "vendeur" && requete.user.role != "administrateur"){
    return resultat.sendStatus(403);
  }

  //validation
  if (produit.nom == null || produit.nom == "" || produit.nom.length > 20 || description.length > 50) {
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

app.delete("/produit/:id", interceptor, (requete, resultat) =>{
  // on récupère le produit
  connection.query("SELECT * FROM materiel WHERE id_materiel = ?", [requete.params.id], (erreur, lignes) => {
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
        console.log(err);
        return resultat.sendStatus(500);//internal server error
      }
      // 204 = no-content = tout c'est bien passé, mais il n(y a rien dans le corp de la réponse)
      return resultat.sendStatu(204);
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
  connection.query(
    `SELECT u.id, u.email, u.password, r.nom 
    FROM utilisateur u 
    JOIN role r on u.role_id = r.id 
    WHERE email = ?`,
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
