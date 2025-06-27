export function intercept (requete, resultat, next){
    console.log(requete.headers.authorization);
    next();
}
module.exports = intercept;