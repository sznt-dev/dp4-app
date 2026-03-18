import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';

// --- Types ---

interface SubmissionPDFData {
  patientName: string;
  patientCpf: string;
  dentistName: string;
  clinicName?: string;
  submissionType: 'first' | 'control';
  completedAt: string;
  sections: PDFSection[];
  scores: {
    lipp?: { score: number; maxScore: number; classification: string };
    bruxismo?: { score: number; maxScore: number; classification: string };
    epworth?: { score: number; maxScore: number; classification: string };
  };
}

interface PDFSection {
  title: string;
  fields: { label: string; value: string }[];
}

// --- Styles ---

const colors = {
  bg: '#FFFFFF',
  headerBg: '#1A1A2E',
  headerText: '#FFFFFF',
  amber: '#D97706',
  sectionBg: '#F8F7F4',
  sectionBorder: '#E5E3DC',
  text: '#1A1A2E',
  textLight: '#6B7280',
  scoreLow: '#059669',
  scoreMed: '#D97706',
  scoreHigh: '#DC2626',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    paddingHorizontal: 36,
    paddingVertical: 28,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: colors.text,
  },
  // Header
  header: {
    backgroundColor: colors.headerBg,
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.headerText,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 8,
    color: '#9CA3AF',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerInfo: {
    fontSize: 8,
    color: '#9CA3AF',
    marginBottom: 1,
  },
  headerPatient: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.headerText,
    marginBottom: 2,
  },
  typeBadge: {
    backgroundColor: colors.amber,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  typeBadgeText: {
    fontSize: 7,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
  },
  // Scores bar
  scoresBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  scoreCard: {
    flex: 1,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.sectionBorder,
  },
  scoreLabel: {
    fontSize: 7,
    color: colors.textLight,
    marginBottom: 3,
  },
  scoreValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
  },
  scoreMax: {
    fontSize: 9,
    color: colors.textLight,
  },
  scoreClassification: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
  },
  // Section
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.amber,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.sectionBorder,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  rowAlt: {
    backgroundColor: colors.sectionBg,
    borderRadius: 2,
  },
  fieldLabel: {
    width: '40%',
    fontSize: 8,
    color: colors.textLight,
  },
  fieldValue: {
    width: '60%',
    fontSize: 8.5,
    color: colors.text,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.sectionBorder,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: colors.textLight,
  },
});

// --- Score color helper ---

function getScoreColor(score: number, max: number): string {
  const ratio = score / max;
  if (ratio < 0.3) return colors.scoreLow;
  if (ratio < 0.6) return colors.scoreMed;
  return colors.scoreHigh;
}

// --- PDF Document ---

function DP4Document({ data }: { data: SubmissionPDFData }) {
  const completedDate = new Date(data.completedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>DP4</Text>
            <Text style={styles.headerSubtitle}>Prontuário Digital de Bruxismo</Text>
            {data.submissionType === 'control' && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>CONTROLE</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerPatient}>{data.patientName}</Text>
            <Text style={styles.headerInfo}>CPF: {formatCPF(data.patientCpf)}</Text>
            <Text style={styles.headerInfo}>Dentista: {data.dentistName}</Text>
            {data.clinicName && <Text style={styles.headerInfo}>{data.clinicName}</Text>}
            <Text style={styles.headerInfo}>{completedDate}</Text>
          </View>
        </View>

        {/* Scores */}
        {(data.scores.lipp || data.scores.bruxismo || data.scores.epworth) && (
          <View style={styles.scoresBar}>
            {data.scores.lipp && (
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>ESTRESSE LIPP</Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(data.scores.lipp.score, 12) }]}>
                  {data.scores.lipp.score}
                  <Text style={styles.scoreMax}>/{data.scores.lipp.maxScore}</Text>
                </Text>
                <Text style={[styles.scoreClassification, { color: getScoreColor(data.scores.lipp.score, 12) }]}>
                  {data.scores.lipp.classification}
                </Text>
              </View>
            )}
            {data.scores.bruxismo && (
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>BRUXISMO</Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(data.scores.bruxismo.score, 20) }]}>
                  {data.scores.bruxismo.score}
                  <Text style={styles.scoreMax}>/{data.scores.bruxismo.maxScore}</Text>
                </Text>
                <Text style={[styles.scoreClassification, { color: getScoreColor(data.scores.bruxismo.score, 20) }]}>
                  {data.scores.bruxismo.classification}
                </Text>
              </View>
            )}
            {data.scores.epworth && (
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>EPWORTH</Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(data.scores.epworth.score, 24) }]}>
                  {data.scores.epworth.score}
                  <Text style={styles.scoreMax}>/{data.scores.epworth.maxScore}</Text>
                </Text>
                <Text style={[styles.scoreClassification, { color: getScoreColor(data.scores.epworth.score, 24) }]}>
                  {data.scores.epworth.classification}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Data sections */}
        {data.sections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.fields.map((field, fIdx) => (
              <View
                key={fIdx}
                style={[styles.row, fIdx % 2 === 0 ? styles.rowAlt : undefined].filter(Boolean) as typeof styles.row[]}
              >
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldValue}>{field.value}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            DP4 — Prontuário Digital de Bruxismo
          </Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
}

function formatCPF(cpf: string): string {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

// --- Export function ---

export async function generateSubmissionPDF(data: SubmissionPDFData): Promise<Buffer> {
  return await renderToBuffer(<DP4Document data={data} />);
}

export type { SubmissionPDFData, PDFSection };
