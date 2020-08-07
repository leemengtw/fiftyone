import React, { useEffect, useCallback, useMemo, useRef } from "react";
import styled from "styled-components";
import { useSpring } from "react-spring";
import { useMachine } from "@xstate/react";
import { useRecoilState, useRecoilValue } from "recoil";
import { GlobalHotKeys } from "react-hotkeys";

import { port, stateDescription } from "../../recoil/atoms";
import ViewStage, { AddViewStage } from "./ViewStage/ViewStage";
import viewBarMachine from "./viewBarMachine";

function useOutsideClick(ref, callback) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}

const ViewBarContainer = styled.div`
  position: relative;
  width: 100%;
  padding: 1rem 0 0 0;
  background-color: ${({ theme }) => theme.background};
`;

const ViewBarDiv = styled.div`
  background-color: ${({ theme }) => theme.backgroundDark};
  border-radius: 3px;
  border: 1px solid ${({ theme }) => theme.backgroundDarkBorder};
  box-sizing: border-box;
  height: 54px;
  width: 100%;
  padding: 0 0.25rem;
  overflow: auto;
  display: flex;

  &::-webkit-scrollbar {
    width: 0px;
    background: transparent;
    display: none;
  }
  &::-webkit-scrollbar-thumb {
    width: 0px;
    display: none;
  }
`;

/*const connectedViewBarMachine = viewBarMachine.withConfig(
  {
    actions: {
      submit: (ctx) => {
        // ...
      },
    },
  },
  // load view from recoil
  {
    stage: 
  }
);*/

const viewBarKeyMap = {
  VIEW_BAR_FOCUS: "alt+v",
  VIEW_BAR_BLUR: "esc",
  VIEW_BAR_NEXT: "right",
  VIEW_BAR_PREVIOUS: "left",
  VIEW_BAR_NEXT_STAGE: "shift+right",
  VIEW_BAR_PREVIOUS_STAGE: "shift+left",
};

const ViewBar = () => {
  const [stateDescriptionValue, setStateDescription] = useRecoilState(
    stateDescription
  );
  const portValue = useRecoilValue(port);

  useEffect(() => {
    send({
      type: "UPDATE",
      port: portValue,
      stateDescription: stateDescriptionValue,
      setStateDescription,
    });
  }, [portValue, stateDescriptionValue, setStateDescription]);

  const [state, send] = useMachine(viewBarMachine);

  const { stages, activeStage } = state.context;
  const barRef = useRef(null);

  const handlers = {
    VIEW_BAR_FOCUS: useCallback(() => send("FOCUS"), []),
    VIEW_BAR_BLUR: useCallback(() => send("BLUR"), []),
    VIEW_BAR_NEXT: useCallback(() => send("NEXT"), []),
    VIEW_BAR_PREVIOUS: useCallback(() => send("PREVIOUS"), []),
    VIEW_BAR_NEXT_STAGE: useCallback(() => send("NEXT_STAGE"), []),
    VIEW_BAR_PREVIOUS_STAGE: useCallback(() => send("PREVIOUS_STAGE"), []),
  };

  useOutsideClick(barRef, () => send("BLUR"));

  return (
    <ViewBarContainer>
      <GlobalHotKeys handlers={handlers} keyMap={viewBarKeyMap} />
      <ViewBarDiv onClick={() => send("FOCUS")} ref={barRef}>
        {state.matches("running")
          ? stages.map((stage, i) => {
              return (
                <React.Fragment key={stage.id}>
                  {stage.submitted && (i === 0 || stages[i - 1].submitted) ? (
                    <AddViewStage
                      key={`insert-button-${stage.id}`}
                      send={send}
                      index={i}
                      active={
                        activeStage === i - 0.5 &&
                        state.matches("running.focus.focused")
                      }
                    />
                  ) : null}
                  <ViewStage key={stage.id} stageRef={stage.ref} />
                </React.Fragment>
              );
            })
          : null}
        {state.matches("running") && stages[stages.length - 1].submitted ? (
          <AddViewStage
            key={`insert-button-tail`}
            send={send}
            index={stages.length}
            active={
              activeStage === stages.length - 0.5 &&
              state.matches("running.focus.focused")
            }
          />
        ) : null}
      </ViewBarDiv>
    </ViewBarContainer>
  );
};

export default ViewBar;
