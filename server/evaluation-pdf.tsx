/* eslint-disable jsx-a11y/alt-text -- FormePDF Image is not an HTML img element. */
import { Document, Image, Page, Text, View } from "@formepdf/react";
import fs from "node:fs";
import path from "node:path";
import type { EvaluationExportData } from "./evaluation-export-types";

function imageData(filename: string): string {
  const filePath = path.join(process.cwd(), "public", "logos", filename);
  const bytes = fs.readFileSync(filePath);
  const mime = path.extname(filename).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

const sosLogo = imageData("sos-logo.jpg");
const erasmusLogo = imageData("erasmus-logo.jpg");
const euLogo = imageData("eu-co-funded-sk.png");

export function EvaluationPdf({ data }: { data: EvaluationExportData }) {
  const total = data.categories.reduce((sum, category) => sum + category.score, 0);
  const met = total >= 35;

  return (
    <Document
      title={`Hodnotenie - ${data.applicantName}`}
      author="SOŠ technológií a remesiel"
      subject="Výsledok hodnotenia prihlášky Erasmus+"
      lang="sk"
    >
      <Page size="A4" margin={{ top: 38, right: 42, bottom: 42, left: 42 }}>
        <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 2, borderBottomColor: "#1672c4", paddingBottom: 12, marginBottom: 18 }}>
          <Image src={sosLogo} width={54} height={54} />
          <View style={{ flexGrow: 1, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 9, color: "#51606f", marginBottom: 3 }}>SOŠ TECHNOLÓGIÍ A REMESIEL</Text>
            <Text style={{ fontSize: 17, fontWeight: "bold", color: "#102a43" }}>Hodnotenie prihlášky Erasmus+</Text>
            <Text style={{ fontSize: 9, color: "#65788b", marginTop: 3 }}>Výberové konanie 2026/2027</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 5 }}>
            <Image src={erasmusLogo} width={76} height={28} />
            <Image src={euLogo} width={105} height={25} />
          </View>
        </View>

        <View style={{ backgroundColor: "#f1f6fb", borderRadius: 6, padding: 13, marginBottom: 16 }}>
          <Text style={{ fontSize: 8, color: "#60758a", textTransform: "uppercase", letterSpacing: .8, marginBottom: 4 }}>Žiak</Text>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#102a43", marginBottom: 8 }}>{data.applicantName}</Text>
          <View style={{ flexDirection: "row", gap: 24 }}>
            <View style={{ flexGrow: 1 }}>
              <Text style={{ fontSize: 8, color: "#60758a", marginBottom: 2 }}>Trieda</Text>
              <Text style={{ fontSize: 11, fontWeight: "bold" }}>{data.className || "Neuvedená"}</Text>
            </View>
            <View style={{ flexGrow: 2 }}>
              <Text style={{ fontSize: 8, color: "#60758a", marginBottom: 2 }}>Odbor</Text>
              <Text style={{ fontSize: 11, fontWeight: "bold" }}>{data.fieldOfStudy || "Neuvedený"}</Text>
            </View>
          </View>
        </View>

        <Text style={{ fontSize: 12, fontWeight: "bold", color: "#102a43", marginBottom: 9 }}>Hodnotiace kategórie</Text>
        {data.categories.map((category, index) => (
          <View key={`${index}-${category.categoryName}`} style={{ borderWidth: 1, borderColor: "#d7e0e8", borderRadius: 5, marginBottom: 8, overflow: "hidden" }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#edf4fa", padding: 8 }}>
              <Text style={{ width: 22, fontSize: 10, fontWeight: "bold", color: "#1672c4" }}>{index + 1}.</Text>
              <Text style={{ flexGrow: 1, fontSize: 10, fontWeight: "bold", color: "#102a43" }}>{category.categoryName}</Text>
              <Text style={{ width: 48, textAlign: "right", fontSize: 11, fontWeight: "bold", color: "#102a43" }}>{`${category.score}/10`}</Text>
            </View>
            <View style={{ padding: 8 }}>
              <Text style={{ fontSize: 8, color: "#60758a", marginBottom: 3 }}>Hodnotiteľ: {category.reviewerName}</Text>
              <Text style={{ fontSize: 9, lineHeight: 1.35, color: "#273849" }}>{category.comment || "Bez slovného komentára"}</Text>
            </View>
          </View>
        ))}

        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: met ? "#e8f6ed" : "#fdecec", borderWidth: 1, borderColor: met ? "#63ad78" : "#d36b6b", borderRadius: 6, padding: 13, marginTop: 6 }}>
          <View style={{ flexGrow: 1 }}>
            <Text style={{ fontSize: 8, color: met ? "#397047" : "#8b3d3d", marginBottom: 3 }}>CELKOVÉ HODNOTENIE</Text>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: met ? "#245c35" : "#7c2929" }}>{met ? "Kritérium splnené" : "Kritérium nesplnené"}</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: met ? "#245c35" : "#7c2929" }}>{`${total}/50`}</Text>
        </View>

        <Text style={{ marginTop: 16, textAlign: "center", fontSize: 8, color: "#8a98a6" }}>Interný dokument školy - systém hodnotenia prihlášok Erasmus+</Text>
      </Page>
    </Document>
  );
}
