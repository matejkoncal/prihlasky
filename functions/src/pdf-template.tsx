import { Document, Page, View, Text, Image } from "@formepdf/react";

interface ApplicationData {
  name: string;
  dateOfBirth: string;
  classField: string;
  address1: string;
  address2: string;
  address3: string;
  phone: string;
  email: string;
  date: string;
}

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

export function ApplicationPdf(props: { data: ApplicationData }) {
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
            marginBottom: 16,
          }}
        >
          <Image src="./assets/sos-logo.jpg" height={50} />
          <Image src="./assets/erasmus-logo.jpg" height={35} />
          <Image src="./assets/saaic-logo.jpg" height={35} />
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

        {/* Confirmation text */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 10, lineHeight: 1.6 }}>
            Svojím podpisom potvrdzujem prihlášku do výberového konania na
            projekt Erasmus+.
          </Text>
          <Text style={{ fontSize: 10, lineHeight: 1.6, color: "#555" }}>
            I confirm the application for the tender for the Erasmus+ project.
          </Text>
        </View>

        {/* Date and signature */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 32,
          }}
        >
          <View>
            <Text style={{ fontSize: 10 }}>V Bratislave, dňa: {data.date}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 10 }}>
              Podpis / Signature: ............................
            </Text>
          </View>
        </View>

        {/* Attachments */}
        <View style={{ marginTop: 32 }}>
          <Text
            style={{
              fontSize: 10,
              textDecoration: "underline",
              marginBottom: 6,
            }}
          >
            Prílohy v anglickom jazyku / Attachment in English:
          </Text>
          <Text style={{ fontSize: 10, marginBottom: 4 }}>
            Životopis – Europass - https://europa.eu/europass/en
          </Text>
          <Text style={{ fontSize: 10 }}>
            Motivačný list (predstavy a očakávania účastníka mobility) formou
            interview
          </Text>
        </View>

        {/* Footer */}
        <View style={{ marginTop: 60, textAlign: "center" }}>
          <Text style={{ fontSize: 9, color: "#999" }}>
            Uvedené informácie sú určené pre interné potreby školy
          </Text>
        </View>
      </Page>
    </Document>
  );
}
