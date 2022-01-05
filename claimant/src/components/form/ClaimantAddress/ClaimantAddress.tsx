import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { ClaimSchemaField } from "../../../common/YupBuilder";
import Address from "../Address/Address";
import { CheckboxField } from "../fields/CheckboxField/CheckboxField";
import { ADDRESS_SKELETON } from "../../../utils/claim_form";

export const CLAIMANT_ADDRESS_SCHEMA_FIELDS: ClaimSchemaField[] = [
  "residence_address",
  "LOCAL_mailing_address_same",
  "mailing_address",
];

type ClaimantAddressValues = {
  LOCAL_mailing_address_same: boolean;
  residence_address: AddressType;
  mailing_address: AddressType;
};

export const ClaimantAddress = () => {
  const { t } = useTranslation("contact");

  const { values, setFieldValue } = useFormikContext<ClaimantAddressValues>();

  // Reset mailing_address if unchecked
  useEffect(() => {
    if (!values.LOCAL_mailing_address_same) {
      setFieldValue("mailing_address", { ...ADDRESS_SKELETON });
    }
  }, [values.LOCAL_mailing_address_same]);

  // Keep mailing_address synchronized if checked
  useEffect(() => {
    if (values.LOCAL_mailing_address_same) {
      setFieldValue("mailing_address", { ...values.residence_address });
    }
  }, [values.LOCAL_mailing_address_same, values.residence_address]);

  return (
    <>
      <Fieldset legend={t("label.primary_address")}>
        <Address basename="residence_address" />
      </Fieldset>
      <CheckboxField
        id="LOCAL_mailing_address_same"
        name="LOCAL_mailing_address_same"
        data-testid="LOCAL_mailing_address_same"
        label={t("label.mailing_address_same")}
      />
      {!values.LOCAL_mailing_address_same && (
        <Fieldset legend={t("label.mailing_address")}>
          <Address basename="mailing_address" />
        </Fieldset>
      )}
    </>
  );
};
