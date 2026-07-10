/* eslint-disable jsx-a11y/alt-text -- FormePDF Image is not an HTML img element. */
import { Document, Page, View, Text, Image } from "@formepdf/react";
import fs from "fs";
import path from "path";
import type { PdfApplicationData } from "./application-types";

function loadImageAsDataUri(filename: string): string {
  const filePath = path.join(process.cwd(), "public", "logos", filename);
  const data = fs.readFileSync(filePath);
  const mimeType = path.extname(filename).toLowerCase() === ".png"
    ? "image/png"
    : "image/jpeg";
  return `data:${mimeType};base64,${data.toString("base64")}`;
}

const sosLogo = loadImageAsDataUri("sos-logo.jpg");
const erasmusLogo = loadImageAsDataUri("erasmus-logo.jpg");
const saicLogo = loadImageAsDataUri("saaic-logo.jpg");
const euCoFundedLogo = loadImageAsDataUri("eu-co-funded-sk.png");

const label = {
  fontSize: 11,
  color: "#333",
};

const value = {
  fontSize: 11,
  color: "#000",
  borderBottomWidth: 1,
  borderBottomColor: "#999",
  borderStyle: "dotted" as const,
  paddingBottom: 2,
  minHeight: 16,
  flexGrow: 1,
};

const row = {
  flexDirection: "row" as const,
  alignItems: "flex-end" as const,
  marginBottom: 10,
  gap: 8,
};

export function ApplicationPdf(props: { data: PdfApplicationData }) {
  const { data } = props;

  return (
    <Document title="Prihláška Erasmus+" author="SOŠ technológií a remesiel">
      <Page size="A4" margin={48}>
        {/* Header */}
        <View
          style={{
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 10, color: "#1a6faa" }}>
            Stredná odborná škola technológií a remesiel, Ivanská cesta 21, 820
            16 Bratislava
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 40,
            marginBottom: 6,
          }}
        >
          <Image src={sosLogo} height={50} />
          <Image src={erasmusLogo} height={35} />
          <Image src={saicLogo} height={35} />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Image src={euCoFundedLogo} width={170} />
        </View>

        {/* Title */}
        <View style={{ textAlign: "center", marginBottom: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#000" }}>
            Prihláška do výberového konania na projekt Erasmus+ pre školský rok
            2026/2027
          </Text>
        </View>
        <View style={{ textAlign: "center", marginBottom: 24 }}>
          <Text style={{ fontSize: 10, color: "#666" }}>
            The Application for the Erasmus+ project in the 2026/2027 school
            year
          </Text>
        </View>

        {/* Form fields */}
        <View style={row}>
          <Text style={{ ...label, width: 200 }}>
            Meno a priezvisko / Name and surname:
          </Text>
          <Text style={value}>{data.name}</Text>
        </View>

        <View style={row}>
          <Text style={{ ...label, width: 200 }}>
            Dátum narodenia / Date of Birth:
          </Text>
          <Text style={value}>{data.dateOfBirth}</Text>
        </View>

        <View style={row}>
          <Text style={{ ...label, width: 200 }}>Trieda, odbor / Class:</Text>
          <Text style={value}>{data.classField}</Text>
        </View>

        <View style={row}>
          <Text style={{ ...label, width: 200 }}>
            Adresa bydliska / Address:
          </Text>
          <Text style={value}>{data.address1}</Text>
        </View>

        {data.address2 && (
          <View style={row}>
            <Text style={{ ...label, width: 200 }}> </Text>
            <Text style={value}>{data.address2}</Text>
          </View>
        )}

        {data.address3 && (
          <View style={row}>
            <Text style={{ ...label, width: 200 }}> </Text>
            <Text style={value}>{data.address3}</Text>
          </View>
        )}

        <View style={row}>
          <Text style={{ ...label, width: 200 }}>Telefón / Phone Nr:</Text>
          <Text style={value}>{data.phone}</Text>
        </View>

        <View style={row}>
          <Text style={{ ...label, width: 200 }}>Emailová adresa / email:</Text>
          <Text style={value}>{data.email}</Text>
        </View>

        <View style={row}>
          <Text style={{ ...label, width: 200 }}>Situácia žiaka:</Text>
          <Text style={value}>{data.studentSituation}</Text>
        </View>

        <View
          style={{
            marginTop: 6,
            padding: 10,
            borderWidth: 1,
            borderColor: "#bbb",
          }}
        >
          <Text style={{ fontSize: 9, lineHeight: 1.4, color: "#333" }}>
            Súhlasím so spracovaním osobných údajov uvedených v tejto prihláške
            na účely výberového konania projektu Erasmus+.
          </Text>
          <Text style={{ fontSize: 10, fontWeight: "bold", marginTop: 5 }}>
            Súhlas udelený: Áno
          </Text>
        </View>

        {/* Footer */}
        <View style={{ marginTop: 20, textAlign: "center" }}>
          <Text style={{ fontSize: 9, color: "#999" }}>
            Uvedené informácie sú určené pre interné potreby školy
          </Text>
        </View>
      </Page>
    </Document>
  );
}
