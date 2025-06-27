export function intercept (requete, resultat, next){
    // on récupère le token dans l'en-tête
    const token = requete.headers.authorization;
    try {
        // on vérifie si il n'y a pas de jwt ou si il est invalide
        if (!token || !jwtUtils.verify(token, "azerty123")){
            return resultat.sendStatus(401);
        }
    } catch {
        //cas ou le format du jwt est invalide
        return resultat.sendStatus(401);
    }
    next();
}
module.exports = intercept;