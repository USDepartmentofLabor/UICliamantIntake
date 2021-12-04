import { useState } from "react";

import { Routes, Route, NavLink, Link, Navigate } from "react-router-dom";

import { ReactQueryDevtools } from "react-query/devtools";

import {
  GovBanner,
  Header,
  Title,
  NavMenuButton,
  PrimaryNav,
  GridContainer,
  Link as ExtLink,
} from "@trussworks/react-uswds";

import { Routes as ROUTES } from "./routes";
import WhoAmIPage from "./pages/Whoami/Whoami";
import HomePage from "./pages/Home/Home";
import { AuthContainer } from "./common/AuthContainer";
import { useTranslation } from "react-i18next";

// These classes are imported globally and can be used on every page
import "./styles.scss";
import "@trussworks/react-uswds/lib/index.css";
import { FormPath } from "./pages/PageDefinition";

function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { HOME_PAGE, WHOAMI_PAGE } = ROUTES;
  const { t } = useTranslation("common");
  const baseUrl = process.env.REACT_APP_BASE_URL || "";
  const logoutUrl = `${baseUrl}/logout/`;

  const toggleMobileNav = () => {
    setMobileNavOpen((prevOpen) => !prevOpen);
  };

  const initialFormPath: FormPath = "/claim/personal-information";

  const navItems = [
    <NavLink
      end
      to={HOME_PAGE}
      key={HOME_PAGE}
      className={({ isActive }) => (isActive ? "usa-current" : "")}
    >
      Home
    </NavLink>,
    <NavLink
      end
      to={WHOAMI_PAGE}
      key={WHOAMI_PAGE}
      className={({ isActive }) => (isActive ? "usa-current" : "")}
    >
      Who am I
    </NavLink>,
  ];

  return (
    <>
      <Header basic>
        <GovBanner />
        <div className="usa-nav-container">
          <div className="usa-navbar">
            <Title>
              <Link to={HOME_PAGE}>Unemployment Insurance</Link>
            </Title>
            <NavMenuButton
              label="Menu"
              onClick={toggleMobileNav}
              className="usa-menu-btn"
            />
          </div>

          <PrimaryNav
            aria-label="Primary navigation"
            items={navItems}
            onToggleMobileNav={toggleMobileNav}
            mobileExpanded={mobileNavOpen}
          />
        </div>
        <ExtLink href={logoutUrl}>{t("logout")}</ExtLink>
      </Header>

      <section className="usa-section">
        <GridContainer>
          <AuthContainer>
            <Routes>
              <Route path={WHOAMI_PAGE} element={<WhoAmIPage />} />
              <Route path={`/claim/:page/*`} element={<HomePage />} />
              <Route
                path={`${HOME_PAGE}`}
                element={<Navigate replace to={initialFormPath} />}
              />
            </Routes>
          </AuthContainer>
        </GridContainer>
      </section>
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

export default App;
