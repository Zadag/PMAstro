import { useState, useEffect } from "react";
import styled from "styled-components";
import logo from "../assets/100.png";
import redChecker from "../assets/tiles/red-checker.png";

type IBanner = {
  visible: boolean;
};

const Banner = () => {
  const [showBanner, setShowBanner] = useState(false);

  const buttonHandler = () => {
    console.log("test");
    setShowBanner(false);
  };

  useEffect(() => {
    if (!localStorage["100bannerclosed"]) {
      localStorage.setItem("100bannerclosed", JSON.stringify(true));
      setShowBanner(true);
    }
  }, []);

  return (
    showBanner && (
      <BannerDiv>
        <img src={logo} alt="Paper Mario logo modified to say 'Decomp 100%!'" />
        <div>
          <b>We have reached 100% on the US release!</b>
          <br />
          Paper Mario is the 3rd N64-exclusive game to be fully decompiled
          (after SM64 and OOT).
          <br />
          The team is immensely grateful to all contributors and supporters -
          thank you!
          <br />
        </div>
        <DismissButton onClick={buttonHandler}>Dismiss</DismissButton>
      </BannerDiv>
    )
  );
};

const DismissButton = styled.button`
  border-top-color: #f04e54;
  border-left-color: #f04e54;
  border-bottom-color: #7f1729;
  border-right-color: #7f1729;
  background-color: #b4313e;
  &:hover {
    cursor: pointer;
  }
`;

const BannerDiv = styled.div`
  position: absolute;
  top: 0;
  z-index: 2;
  width: 100%;
  min-height: 6em;

  color: white;
  background-color: #518bff;
  background-image: url(${redChecker});

  padding: 0.5em;

  display: flex;
  align-items: center;
  justify-content: space-around;
`;

export default Banner;
