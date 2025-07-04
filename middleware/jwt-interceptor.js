const jwtUtils = require("jsonwebtoken");


function intercept (requete, resultat, next){
    // on récupère le token dans l'en-tête
    const token = requete.headers.authorization;
    try {
        // on vérifie si il n'y a pas de jwt ou si il est invalide
        if (!token || !jwtUtils.verify(token, "azerty123")){
            console.log("token : " + token);
            console.log("valide : " + !jwtUtils.verify(token, "azerty123"));

            return resultat.sendStatus(401);
        }
        const jwtParts = token.split("."); // découpe le jwt en 3 parties
        const jwtBodyBase64 = jwtParts[1]; // Récupère la partie data du jwt
        const jwtBodyDecoded = atob (jwtBodyBase64); // décode la base 64
        const body = JSON.parse(jwtBodyDecoded); // on transforme le JSON on objet javascript
        
        console.log(body.role);
        requete.user = body;
        
    } catch (e) {
        //cas ou le format du jwt est invalide
        console.log("format invalide");
        console.log(e);
        console.log(token);
        return resultat.sendStatus(401);
    }
    next();
}
module.exports = intercept;