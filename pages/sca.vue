<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <v-row>
          <!-- LEFT SIDEBAR: filters & column selection -->
          <v-col cols="12" md="3">
            <v-card elevation="2" class="pa-4">
              <h2 class="text-h6 mb-4">SCA Filters</h2>
              
              <!-- SEARCH BOX -->
              <v-text-field
                v-model="filter"
                label="Search (Repo, Package...)"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-magnify"
                class="mb-4"
              />
              
              <!-- COLUMN SELECTION -->
              <h2 class="text-h6 mb-2">Select Columns:</h2>
              <div v-for="col in allColumns" :key="col.key" class="mb-1">
                <v-checkbox
                  v-model="selectedColumnKeys"
                  :label="col.label"
                  :value="col.key"
                  density="comfortable"
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

          <!-- RIGHT SIDE: data table -->
          <v-col cols="12" md="9">
            <v-card elevation="2">
              <v-card-title>
                <h2 class="text-h6 m-0">
                  SCA Dashboard (Vuetify Premium w/ Sidebar)
                </h2>
              </v-card-title>

              <v-data-table
                :headers="displayedHeaders"
                :items="filteredRows"
                :search="filter"
                :items-per-page="10"
                class="elevation-0"
                :footer-props="{ itemsPerPageOptions: [5, 10, 20, { text:'All', value:-1 }] }"
              />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import Papa from 'papaparse'
import { ref, computed, onMounted } from 'vue'

// 1) All possible columns in your CSV
const allColumns = [
  { key: 'Repo',               label: 'Repo' },
  { key: 'Target',             label: 'Target' },
  { key: 'Vulnerability ID',   label: 'Vulnerability ID' },
  { key: 'Severity',           label: 'Severity' },
  { key: 'Package',            label: 'Package' },
  { key: 'Installed Version',  label: 'Installed Version' },
  { key: 'Fixed Version',      label: 'Fixed Version' },
  { key: 'Description',        label: 'Description' },
  { key: 'Primary URL',        label: 'Primary URL' },
]

// 2) We'll store the parsed CSV rows here
const scaRows = ref([])

// 3) The user picks which columns to show
//    (initially let's show 5 columns)
const selectedColumnKeys = ref([
  'Repo',
  'Target',
  'Vulnerability ID',
  'Severity',
  'Package',
])

// 4) A text filter
const filter = ref('')

// 5) Fetch the CSV on mount
onMounted(async () => {
  const resp = await fetch('/sca_data.csv')
  const csvText = await resp.text()
  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete(results) {
      scaRows.value = results.data
    },
  })
})

// 6) The displayed headers in <v-data-table> 
const displayedHeaders = computed(() => {
  // Vuetify 3's v-data-table expects objects: { key, title, sortable... }
  return allColumns
    .filter(col => selectedColumnKeys.value.includes(col.key))
    .map(col => ({
      key: col.key,
      title: col.label,
      sortable: true,
    }))
})

// 7) The displayed items. <v-data-table> does a built-in text search with :search="filter"
//    If you want extra logic (like severity-based), do it here. 
const filteredRows = computed(() => {
  return scaRows.value
})

// 8) Export CSV only for selected columns + filtered rows
function exportCsv() {
  // We'll replicate the text filtering logic. 
  const searchText = filter.value.trim().toLowerCase()
  const columnsInUse = displayedHeaders.value  // which columns are displayed?
  
  // Filter the scaRows with the same approach as v-data-table's global search
  let finalRows = scaRows.value
  if (searchText) {
    finalRows = finalRows.filter(item => {
      return columnsInUse.some(col => {
        const val = item[col.key] || ''
        return val.toString().toLowerCase().includes(searchText)
      })
    })
  }

  // Build CSV
  const csvHeader = columnsInUse.map(col => `"${col.title}"`)
  const csvDataRows = finalRows.map(item => {
    return columnsInUse.map(col => {
      const val = item[col.key] ?? ''
      return `"${String(val).replace(/"/g, '""')}"`
    })
  })
  const csvString = [
    csvHeader.join(','), 
    ...csvDataRows.map(r => r.join(',')),
  ].join('\n')

  // Download 
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sca_selection.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
/* Some minor styling for spacing; the rest is Vuetify’s theme */
.v-card {
  border-radius: 8px;
}
</style>
