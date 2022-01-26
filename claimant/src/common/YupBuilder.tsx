import { TFunction } from "react-i18next";
import * as yup from "yup";

// TODO setLocale to customize min/max/matches errors
// https://github.com/jquense/yup#error-message-customization

export const yupPhone = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    number: yup.string().required(t("phone.number.required")),
    type: yup.string(),
    sms: yup.boolean(),
  });

export const yupName = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    first_name: yup
      .string()
      .nullable()
      .max(36)
      .required(t("name.first_name.required")),
    last_name: yup
      .string()
      .nullable()
      .max(36)
      .required(t("name.last_name.required")),
    middle_name: yup.string().nullable().max(36),
  });

export const yupAddress = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    address1: yup.string().max(64).required(t("address.address1.required")),
    address2: yup.string().max(64),
    city: yup.string().max(64).required(t("address.city.required")),
    state: yup.string().max(2).required(t("address.state.required")), // TODO enum?
    zipcode: yup
      .string()
      .max(12)
      .matches(/^\d{5}(-\d{4})?$/)
      .required(t("address.zipcode.required")),
  });
