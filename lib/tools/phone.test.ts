import { describe, expect, test } from "vitest";
import {
  buildPhoneValidatorSearchParams,
  buildPhoneValidatorShareUrl,
  formatBrazilPhone,
  readPhoneValidatorContentFromFragment,
  readPhoneValidatorStateFromParams,
  validatePhoneNumber,
  type PhoneValidatorState,
} from "./phone";

describe("phone validator logic", () => {
  test("formats Brazilian fixed and mobile national numbers", () => {
    expect(formatBrazilPhone("1123456789")).toBe("(11) 2345-6789");
    expect(formatBrazilPhone("11912345678")).toBe("(11) 91234-5678");
    expect(formatBrazilPhone("912345678")).toBeNull();
  });

  test("validates Brazilian mobile and fixed numbers without lookups", () => {
    const mobile = validatePhoneNumber("(11) 91234-5678");
    expect(mobile.status).toBe("valid");
    expect(mobile.kind).toBe("brMobile");
    expect(mobile.ddd).toBe("11");
    expect(mobile.formattedNational).toBe("(11) 91234-5678");
    expect(mobile.e164).toBe("+5511912345678");
    expect(mobile.issues).toContain("dddNotVerified");

    const fixed = validatePhoneNumber("1123456789");
    expect(fixed.status).toBe("valid");
    expect(fixed.kind).toBe("brFixed");
    expect(fixed.formattedNational).toBe("(11) 2345-6789");
    expect(fixed.e164).toBe("+551123456789");
  });

  test("accepts +55 and warns when Brazil country code is typed without plus", () => {
    const withPlus = validatePhoneNumber("+55 11 91234-5678");
    expect(withPlus.status).toBe("valid");
    expect(withPlus.kind).toBe("brMobile");
    expect(withPlus.e164).toBe("+5511912345678");

    const withoutPlus = validatePhoneNumber("55 11 91234-5678");
    expect(withoutPlus.status).toBe("attention");
    expect(withoutPlus.issues).toContain("brCountryCodeWithoutPlus");
    expect(withoutPlus.formattedNational).toBe("(11) 91234-5678");
    expect(withoutPlus.e164).toBe("+5511912345678");
  });

  test("classifies local-only and dialing-prefix Brazilian notation as attention", () => {
    const localOnly = validatePhoneNumber("91234-5678");
    expect(localOnly.status).toBe("attention");
    expect(localOnly.kind).toBe("brLocalOnly");
    expect(localOnly.issues).toContain("brMissingDdd");
    expect(localOnly.formattedLocal).toBe("91234-5678");
    expect(localOnly.e164).toBeNull();

    const trunkPrefix = validatePhoneNumber("0 11 91234-5678");
    expect(trunkPrefix.status).toBe("attention");
    expect(trunkPrefix.kind).toBe("dialingNotation");
    expect(trunkPrefix.issues).toContain("brDialingPrefix");
    expect(trunkPrefix.dialingPrefix).toBe("0");
    expect(trunkPrefix.e164).toBe("+5511912345678");

    const carrierPrefix = validatePhoneNumber("0 15 11 91234-5678");
    expect(carrierPrefix.status).toBe("attention");
    expect(carrierPrefix.kind).toBe("dialingNotation");
    expect(carrierPrefix.dialingPrefix).toBe("015");
    expect(carrierPrefix.e164).toBe("+5511912345678");

    const collectCallPrefix = validatePhoneNumber("90 11 91234-5678");
    expect(collectCallPrefix.status).toBe("attention");
    expect(collectCallPrefix.kind).toBe("dialingNotation");
    expect(collectCallPrefix.issues).toContain("brDialingPrefix");
    expect(collectCallPrefix.dialingPrefix).toBe("90");
    expect(collectCallPrefix.formattedNational).toBe("(11) 91234-5678");
    expect(collectCallPrefix.e164).toBe("+5511912345678");

    const collectCallCarrierPrefix = validatePhoneNumber("90 15 11 2345-6789");
    expect(collectCallCarrierPrefix.status).toBe("attention");
    expect(collectCallCarrierPrefix.kind).toBe("dialingNotation");
    expect(collectCallCarrierPrefix.issues).toContain("brDialingPrefix");
    expect(collectCallCarrierPrefix.dialingPrefix).toBe("9015");
    expect(collectCallCarrierPrefix.formattedNational).toBe("(11) 2345-6789");
    expect(collectCallCarrierPrefix.e164).toBe("+551123456789");
  });

  test("recognizes Brazilian special-service numbers without treating them as personal contacts", () => {
    const utility = validatePhoneNumber("190");
    expect(utility.status).toBe("special");
    expect(utility.kind).toBe("brSpecialUtility");
    expect(utility.issues).toContain("brServiceUtility");
    expect(utility.e164).toBeNull();

    const service = validatePhoneNumber("0800 123 4567");
    expect(service.status).toBe("special");
    expect(service.kind).toBe("brNonGeographic");
    expect(service.issues).toContain("brNonGeographic");
    expect(service.serviceNumber).toBe("0800 123 4567");
    expect(service.e164).toBeNull();
  });

  test("warns for unsupported extensions but validates the base number", () => {
    const result = validatePhoneNumber("+55 (11) 91234-5678 ramal 123");

    expect(result.status).toBe("attention");
    expect(result.issues).toContain("unsupportedExtension");
    expect(result.extension).toBe("ramal 123");
    expect(result.e164).toBe("+5511912345678");
  });

  test("rejects unsupported characters, misplaced plus signs, and non-ASCII digits", () => {
    expect(validatePhoneNumber("11 91234 ABCD").issues).toContain("unsupportedCharacters");
    expect(validatePhoneNumber("11 91234 ABCD").status).toBe("invalid");
    expect(validatePhoneNumber("11🙂912345678").issues).toContain("unsupportedCharacters");
    expect(validatePhoneNumber("+55+11").issues).toContain("multiplePlus");
    expect(validatePhoneNumber("55+11912345678").issues).toContain("misplacedPlus");
    expect(validatePhoneNumber("１１９１２３４５６７８").issues).toContain("nonAsciiDigits");
  });

  test("validates E.164 structure in international mode", () => {
    const valid = validatePhoneNumber("+1 202 555 0184", { mode: "internacional" });
    expect(valid.status).toBe("valid");
    expect(valid.kind).toBe("internationalE164");
    expect(valid.e164).toBe("+12025550184");
    expect(valid.issues).toContain("internationalStructureOnly");

    const missingPlus = validatePhoneNumber("12025550184", { mode: "internacional" });
    expect(missingPlus.status).toBe("attention");
    expect(missingPlus.issues).toContain("missingPlus");
    expect(missingPlus.e164).toBe("+12025550184");

    const dialingNotation = validatePhoneNumber("00 1 202 555 0184", { mode: "internacional" });
    expect(dialingNotation.status).toBe("attention");
    expect(dialingNotation.kind).toBe("dialingNotation");
    expect(dialingNotation.e164).toBe("+12025550184");

    expect(validatePhoneNumber("+1234567", { mode: "internacional" }).issues).toContain("e164TooShort");
    expect(validatePhoneNumber("+1234567890123456", { mode: "internacional" }).issues).toContain("e164TooLong");
    expect(validatePhoneNumber("+05511912345678", { mode: "internacional" }).issues).toContain(
      "e164InvalidCountryCode"
    );
  });

  test("keeps phone content out of normal query params", () => {
    const state: PhoneValidatorState = {
      telefone: "+55 11 91234-5678",
      pais: "internacional",
      saida: "e164",
    };
    const result = buildPhoneValidatorSearchParams(state);

    expect(result.params.toString()).toBe("pais=internacional&saida=e164");
    expect(result.params.get("telefone")).toBeNull();
    expect(result.params.get("phone")).toBeNull();

    expect(
      readPhoneValidatorStateFromParams(
        new URLSearchParams("pais=invalid&saida=invalid&telefone=11912345678&phone=11912345678")
      )
    ).toEqual({
      telefone: "",
      pais: "br",
      saida: "formatado",
    });
  });

  test("builds default share URLs without content and explicit share URLs with hash-only content", () => {
    const state: PhoneValidatorState = {
      telefone: "+55 11 91234-5678",
      pais: "internacional",
      saida: "e164",
    };

    const defaultShare = buildPhoneValidatorShareUrl(
      "https://calculaderia.test/validadores/validador-telefone?telefone=hostile#telefone=hostile",
      state
    );
    expect(defaultShare.url).toBe(
      "https://calculaderia.test/validadores/validador-telefone?pais=internacional&saida=e164"
    );
    expect(defaultShare.fragmentParams.get("telefone")).toBeNull();

    const contentShare = buildPhoneValidatorShareUrl(
      "https://calculaderia.test/validadores/validador-telefone",
      state,
      { includeContent: true }
    );
    expect(contentShare.searchParams.get("telefone")).toBeNull();
    expect(contentShare.fragmentParams.get("conteudo")).toBe("1");
    expect(contentShare.fragmentParams.get("telefone")).toBe("+55 11 91234-5678");
    expect(contentShare.url).toContain("#conteudo=1&telefone=%2B55+11+91234-5678");

    const oversizedShare = buildPhoneValidatorShareUrl(
      "https://calculaderia.test/validadores/validador-telefone",
      { ...state, telefone: "9".repeat(81) },
      { includeContent: true }
    );
    expect(oversizedShare.contentOmitted).toBe(true);
    expect(oversizedShare.fragmentParams.get("telefone")).toBeNull();
  });

  test("hydrates only explicit hash content and length-limits the value", () => {
    expect(readPhoneValidatorContentFromFragment("#telefone=11912345678")).toEqual({
      hasExplicitContent: false,
      telefone: "",
    });
    expect(readPhoneValidatorContentFromFragment("#conteudo=1&phone=11912345678")).toEqual({
      hasExplicitContent: true,
      telefone: "",
    });

    const hydrated = readPhoneValidatorContentFromFragment(`#conteudo=1&telefone=${"9".repeat(120)}`);
    expect(hydrated.hasExplicitContent).toBe(true);
    expect(hydrated.telefone).toHaveLength(80);
  });
});
