<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <v-row>
          <!-- LEFT SIDEBAR: Filters + Column Selection -->
          <v-col cols="12" md="3">
            <v-card elevation="2" class="pa-4">
              <h2 class="text-h6 mb-4">SAST Filters</h2>

              <!-- SEARCH BOX -->
              <v-text-field
                v-model="filter"
                label="Search (Project, Message...)"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-magnify"
                class="mb-4"
              />

              <!-- COLUMN SELECTION CHECKBOXES -->
              <h2 class="text-h6 mb-2">Select Columns:</h2>
              <div
                v-for="col in allColumns"
                :key="col.key"
                class="mb-2"
              >
                <v-checkbox
                  v-model="selectedColumnKeys"
                  :label="col.label"
                  :value="col.key"
                  density="comfortable"
                  hide-details
                />
              </div>

              <!-- EXPORT BUTTON -->
              <v-btn
                color="primary"
                class="mt-4"
                @click="exportCsv"
              >
                Export CSV
              </v-btn>
            </v-card>
          </v-col>

          <!-- RIGHT SIDE: TABLE -->
          <v-col cols="12" md="9">
            <v-card elevation="2">
              <v-card-title>
                <h2 class="text-h6 m-0">
                  SAST Dashboard (Vuetify Premium w/ Sidebar)
                </h2>
              </v-card-title>

              <v-data-table
                :headers="displayedHeaders"
                :items="filteredRows"
                :search="filter"
                :items-per-page="10"
                class="elevation-0"
                :footer-props="{ itemsPerPageOptions: [5, 10, 20, { text: 'All', value: -1 }] }"
                item-class="rowClass"
              />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Papa from 'papaparse'

/**
 * 1) These column keys must EXACTLY match your CSV headers.
 *    Example headers (with spaces):
 *    Project name, Type, Issue Type, Line, Component, Message, Status, Severity, Coverage
 */
const allColumns = [
  { key: 'Project name', label: 'Project' },
  { key: 'Type',         label: 'Type' },        // "issue"/"hotspot"/"coverage"
  { key: 'Issue Type',   label: 'Issue Type' },  // "BUG", "CODE_SMELL", "VULNERABILITY"
  { key: 'Line',         label: 'Line' },
  { key: 'Component',    label: 'Component' },
  { key: 'Message',      label: 'Message' },
  { key: 'Status',       label: 'Status' },      // e.g. OPEN, TO_REVIEW
  { key: 'Severity',     label: 'Severity' },    // e.g. CRITICAL, MAJOR, MINOR
  { key: 'Coverage',     label: 'Coverage' },    // might be blank if row is not coverage
]

// 2) We store the parsed CSV rows
const sastRows = ref([])

// 3) Default columns to show
const selectedColumnKeys = ref([
  'Project name',
  'Issue Type',
  'Severity',
  'Line',
  'Component',
  'Message',
])

// 4) Simple text filter
const filter = ref('')

// 5) Fetch & parse CSV on mount
onMounted(async () => {
  // Replace with the actual name of your CSV file in /public/
  const response = await fetch('/Sonar_result_combined_output.csv')
  const csvText = await response.text()
  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete(results) {
      sastRows.value = results.data
    }
  })
})

// 6) The "displayedHeaders" for <v-data-table>
const displayedHeaders = computed(() => {
  return allColumns
    .filter(col => selectedColumnKeys.value.includes(col.key))
    .map(col => ({
      key: col.key,
      title: col.label,
      sortable: true,
    }))
})

// 7) The actual items <v-data-table> sees
//    If you want advanced filtering beyond the built-in text search, do it here.
const filteredRows = computed(() => {
  return sastRows.value
})

// 8) We highlight rows by severity using item-class="rowClass"
function rowClass(item) {
  // e.g. CRITICAL, MAJOR, MINOR
  const sev = (item['Severity'] || '').toUpperCase()
  switch (sev) {
    case 'CRITICAL': return 'severity-critical-row'
    case 'MAJOR':    return 'severity-major-row'
    case 'MINOR':    return 'severity-minor-row'
    default:         return ''
  }
}

// 9) CSV Export: Only selected columns + filtered rows
function exportCsv() {
  const searchText = filter.value.toLowerCase().trim()
  const columnsInUse = displayedHeaders.value

  let finalRows = sastRows.value
  if (searchText) {
    finalRows = finalRows.filter(item => {
      return columnsInUse.some(col => {
        const val = item[col.key] || ''
        return val.toLowerCase().includes(searchText)
      })
    })
  }

  const headerRow = columnsInUse.map(col => `"${col.title}"`).join(',')
  const dataRows = finalRows.map(row => {
    return columnsInUse.map(col => {
      const val = row[col.key] ?? ''
      return `"${String(val).replace(/"/g, '""')}"`
    }).join(',')
  })
  const csvString = [headerRow, ...dataRows].join('\n')

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sast_filtered.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
/* Premium row highlights by severity */
.severity-critical-row {
  background-color: #ffebee;    /* very light red */
}
.severity-major-row {
  background-color: #fff3e0;    /* light orange */
}
.severity-minor-row {
  background-color: #e8f5e9;    /* light green */
}

/* Some rounding/spaces for a "premium" look */
.v-card {
  border-radius: 8px;
}
</style>
