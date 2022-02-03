import { useTranslation } from "react-i18next";
import TextField from "../fields/TextField/TextField";
import { FormGroup } from "@trussworks/react-uswds";
import { StateAbbrev, StatesDropdown } from "../StatesDropdown/StatesDropdown";

interface IAddressLabels {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipcode: string;
}

interface IAddressProps {
  labels?: IAddressLabels;
  basename: string;
  stateSlice?: StateAbbrev[];
}

export const Address = ({ labels, basename, stateSlice }: IAddressProps) => {
  const { t } = useTranslation("common");
  const defaultLabels: IAddressLabels = {
    address1: t("address.address1.label"),
    address2: t("address.address2.label"),
    city: t("address.city.label"),
    state: t("address.state.label"),
    zipcode: t("address.zipcode.label"),
  };

  return (
    <FormGroup>
      <TextField
        name={`${basename}.address1`}
        label={labels ? labels.address1 : defaultLabels.address1}
        type="text"
        id={`${basename}.address1`}
        data-testid={`${basename}.address1`}
      />
      <TextField
        name={`${basename}.address2`}
        label={labels ? labels.address2 : defaultLabels.address2}
        type="text"
        id={`${basename}.address2`}
        data-testid={`${basename}.address2`}
      />
      <TextField
        name={`${basename}.city`}
        label={labels ? labels.city : defaultLabels.city}
        type="text"
        id={`${basename}.city`}
        data-testid={`${basename}.city`}
      />
      <StatesDropdown
        name={`${basename}.state`}
        label={labels ? labels.state : defaultLabels.state}
        id={`${basename}.state`}
        data-testid={`${basename}.state`}
        startEmpty
        stateSlice={stateSlice}
      />
      <TextField
        // TODO pass medium
        name={`${basename}.zipcode`}
        label={labels ? labels.zipcode : defaultLabels.zipcode}
        type="text"
        inputMode="numeric"
        id={`${basename}.zipcode`}
        data-testid={`${basename}.zipcode`}
      />
    </FormGroup>
  );
};

export default Address;
