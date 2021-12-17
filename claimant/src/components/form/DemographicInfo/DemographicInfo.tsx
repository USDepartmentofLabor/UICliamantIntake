import { Fieldset } from "@trussworks/react-uswds";
import TextField from "../fields/TextField/TextField";
import CheckboxField from "../fields/CheckboxField/CheckboxField";
import { RadioField } from "../fields/RadioField/RadioField";
import DropdownField from "../fields/DropdownField/DropdownField";
import { Normalize, useTranslation } from "react-i18next";
import { FieldArray, useFormikContext } from "formik";
import claimForm from "../../../i18n/en/claimForm";

import formStyles from "../form.module.scss";

type SexOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.sex.options>;
};

const sexOptions: SexOption[] = Object.keys(claimForm.sex.options).map(
  (option) => ({
    value: option,
    translationKey: option as Normalize<typeof claimForm.sex.options>,
  })
);

type RaceOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.race.options>;
};

const raceOptions: RaceOption[] = Object.keys(claimForm.race.options).map(
  (option) => ({
    value: option,
    translationKey: option as Normalize<typeof claimForm.race.options>,
  })
);

type EthnicityOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.ethnicity.options>;
};

const ethnicityOptions: EthnicityOption[] = Object.keys(
  claimForm.ethnicity.options
).map((option) => ({
  value: option,
  translationKey: option as Normalize<typeof claimForm.ethnicity.options>,
}));

type EducationLevelOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.education_level.options>;
};

const educationLevelOptions: EducationLevelOption[] = Object.keys(
  claimForm.education_level.options
).map((option) => ({
  value: option,
  translationKey: option as Normalize<typeof claimForm.education_level.options>,
}));

export const DemographicInfo = () => {
  const { values } = useFormikContext<Claim>();
  const { t } = useTranslation("claimForm");

  return (
    <>
      <TextField
        className={formStyles.field}
        name="dob"
        label={t("dob.label")}
        id="dob"
        type="text"
        readOnly
        disabled
      />
      <Fieldset legend={t("sex.label")} className={formStyles.field}>
        <RadioField
          id="sex"
          name="sex"
          options={sexOptions.map((option) => {
            return {
              label: t(`sex.options.${option.translationKey}`),
              value: option.value,
            };
          })}
        />
      </Fieldset>
      <Fieldset legend={t("ethnicity.label")} className={formStyles.field}>
        <RadioField
          id="ethnicity"
          name="ethnicity"
          options={ethnicityOptions.map((option) => {
            return {
              label: t(`ethnicity.options.${option.translationKey}`),
              value: option.value,
            };
          })}
        />
      </Fieldset>
      <Fieldset legend={t("race.label")} className={formStyles.field}>
        <FieldArray
          name="race"
          render={() =>
            raceOptions.map((raceOption, index) => (
              <CheckboxField
                key={`race.${index}.${raceOption.value}`}
                id={`race.${raceOption.value}`}
                name="race"
                value={raceOption.value}
                label={t(`race.options.${raceOption.translationKey}`)}
                checked={values.race?.includes(raceOption.value)}
              />
            ))
          }
        />
      </Fieldset>
      <DropdownField
        id="education_level"
        name="education_level"
        label={t("education_level.label")}
        options={educationLevelOptions.map((option) => ({
          value: option.value,
          label: t(`education_level.options.${option.translationKey}`),
        }))}
      />
    </>
  );
};
