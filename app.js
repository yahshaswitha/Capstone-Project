const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const { Creator, Election} = require("./models");
const bcrypt = require("bcrypt");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");
const saltRounds = 10;
app.set("views", path.join(__dirname, "views"));
app.use(flash());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("Some secret String"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(
  session({
    secret: "my-super-secret-key-2837428907583420",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use((request, response, next) => {
  response.locals.messages = request.flash();
  next();
});
app.use(passport.initialize());
app.use(passport.session());

passport.use("creator",new LocalStrategy({usernameField: "email",passwordField: "password",},
  (username, password, done) => {
    Creator.findOne({ where: { email: username } })
    .then(async (user) => {
        const result = await bcrypt.compare(password, user.password);
        if (result) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Enter a valid password" });
        }
    })
    .catch((error) => {
        console.log(error);
        return done(null, false, {
          message: "Please signup if you are a new User",
        });
    });
    }
));

passport.serializeUser((user, done) => {
  done(null, { id: user.id, role: user.role });
});
  
passport.deserializeUser((id, done) => {
  Creator.findByPk(id.id)
  .then((user) => {
      done(null, user);
  })
  .catch((error) => {
    done(error, null);
  });
});

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (request, response) => {
  if (request.user) {
    console.log(request.user);
    if (request.user.role === "creator") {
      return response.redirect("/elections");
    } 
   } else {
      response.render("home", {
        title: "Election Portal",
        csrfToken: request.csrfToken(),
      });
    }
});

app.get("/signup", (request, response) => {
  if (request.user) {
    console.log(request.user);
    if (request.user.role === "creator") {
      return response.redirect("/elections");
    } 
   }
    response.render("auth/signup", {
      title: "Signup",
      csrfToken: request.csrfToken(),
    });
});

app.post("/elections", async (request, response) => {
  if (!request.body.firstName) {
    request.flash("error", "Please enter First Name");
    return response.redirect("/signup");
  }
  if (!request.body.email) {
    request.flash("error", "Please enter Email ID");
    return response.redirect("/signup");
  }
  if (!request.body.password) {
    request.flash("error", "Please enter Password");
    return response.redirect("/signup");
  }
  if (request.body.password.length < 8) {
    request.flash("error", "Password must be almost of 8 characters");
    return response.redirect("/signup");
  }
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  try {
    const user = await Creator.addCreator({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        response.redirect("/");
      } else {
        response.redirect("/elections");
      }
    });
  } catch (error) {
    request.flash("error", "Account with this Email Id already exists");
    return response.redirect("/signup");
  }
});

app.get("/login", (request, response) => {
  if (request.user) {
    return response.redirect("/elections");
  }
  else{
    response.render("auth/login", {
    title: "Login",
    csrfToken: request.csrfToken(),
  });
}
});

app.post("/login",passport.authenticate("creator", {failureRedirect: "/login",failureFlash: true,}),
  (request, response) => {response.redirect("/elections");
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get("/elections",connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "creator") {
    let Electionuser = request.user.firstName + " " + request.user.lastName;
    try {
      const elections = await Election.GetElections(request.user.id);
      console.log(elections)
      if (request.accepts("html")) {
        response.render("election/election", {
          title: "Elections",
          csrfToken: request.csrfToken(),
          Electionuser: Electionuser,
          elections,
        });
      } else {
        return response.json({
          elections,            
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
} 
);

app.get("/elections/new",connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "creator") {
      return response.render("election/newElection", {
        title: "Create a new Election",
        csrfToken: request.csrfToken(),
      });
    }
  }    
);

app.post("/elections/new",connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.user.role === "creator") {
      if (request.body.name.length < 5) {
        request.flash("error", "Name of election must atleast be 5 characters");
        return response.redirect("/elections/new");
      }
      if (request.body.customurl.length < 5 && request.body.customurl.length!=0) {
        request.flash("error", "Election url must atleast be 5 characters");
        return response.redirect("/elections/new");
      }
      if (request.body.customurl.includes(" ") ||request.body.customurl.includes("\t") ||request.body.customurl.includes("\n")
      ){
        request.flash("error", "Election url must not contain any space");
        return response.redirect("/elections/new");
      }
      try {
        await Election.addElection({        
          creatorID: request.user.id,
          name: request.body.name,
          customurl: request.body.customurl,
        });
        return response.redirect("/elections");
      } catch (error) {
        request.flash("error", "Email is already in used");
        return response.redirect("/elections/new");
      } 
    }
  }    
);


module.exports = app;