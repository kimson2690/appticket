<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class ExcelReportService
{
    private $spreadsheet;
    
    public function __construct()
    {
        $this->spreadsheet = new Spreadsheet();
    }
    
    /**
     * Génère le rapport comptable mensuel
     */
    public function generateAccountingReport($data, $companyName, $month, $year)
    {
        // Créer les 5 onglets
        $this->createSummarySheet($data['summary'], $companyName, $month, $year);
        $this->createEmployeeSheet($data['by_employee']);
        $this->createRestaurantSheet($data['by_restaurant']);
        $this->createDateSheet($data['by_date']);
        $this->createReconciliationSheet($data['reconciliation']);
        
        // Définir l'onglet actif par défaut
        $this->spreadsheet->setActiveSheetIndex(0);
        
        return $this->spreadsheet;
    }
    
    /**
     * Onglet 1: Synthèse
     */
    private function createSummarySheet($summary, $companyName, $month, $year)
    {
        $sheet = $this->spreadsheet->getActiveSheet();
        $sheet->setTitle('Synthèse');
        
        // Titre principal
        $sheet->setCellValue('A1', 'RAPPORT COMPTABLE MENSUEL');
        $sheet->mergeCells('A1:D1');
        $this->styleHeader($sheet, 'A1:D1', 16, true);
        
        // Informations période
        $sheet->setCellValue('A3', 'Entreprise:');
        $sheet->setCellValue('B3', $companyName);
        $sheet->setCellValue('A4', 'Période:');
        $sheet->setCellValue('B4', $this->getMonthName($month) . ' ' . $year);
        $this->styleBold($sheet, 'A3:A4');
        
        // Section Tickets
        $row = 6;
        $sheet->setCellValue('A' . $row, 'TICKETS');
        $sheet->mergeCells('A' . $row . ':D' . $row);
        $this->styleHeader($sheet, 'A' . $row . ':D' . $row, 12);
        
        $row++;
        $sheet->setCellValue('A' . $row, 'Indicateur');
        $sheet->setCellValue('B' . $row, 'Nombre');
        $sheet->setCellValue('C' . $row, 'Montant (F CFA)');
        $sheet->setCellValue('D' . $row, 'Pourcentage');
        $this->styleHeader($sheet, 'A' . $row . ':D' . $row, 11);
        
        // Tickets affectés
        $row++;
        $sheet->setCellValue('A' . $row, 'Tickets affectés');
        $sheet->setCellValue('B' . $row, $summary['tickets_assigned_count']);
        $sheet->setCellValue('C' . $row, $summary['tickets_assigned_amount']);
        $sheet->setCellValue('D' . $row, '100%');
        $this->styleAmount($sheet, 'C' . $row);
        
        // Tickets consommés
        $row++;
        $sheet->setCellValue('A' . $row, 'Tickets consommés');
        $sheet->setCellValue('B' . $row, $summary['tickets_used_count']);
        $sheet->setCellValue('C' . $row, $summary['tickets_used_amount']);
        $sheet->setCellValue('D' . $row, $summary['usage_rate']);
        $this->styleAmount($sheet, 'C' . $row);
        $this->stylePercent($sheet, 'D' . $row);
        
        // Tickets restants
        $row++;
        $sheet->setCellValue('A' . $row, 'Tickets restants');
        $sheet->setCellValue('B' . $row, $summary['tickets_remaining_count']);
        $sheet->setCellValue('C' . $row, $summary['tickets_remaining_amount']);
        $sheet->setCellValue('D' . $row, 100 - $summary['usage_rate']);
        $this->styleAmount($sheet, 'C' . $row);
        $this->stylePercent($sheet, 'D' . $row);
        $this->styleBold($sheet, 'A' . $row . ':D' . $row);
        
        // Section Statistiques
        $row += 2;
        $sheet->setCellValue('A' . $row, 'STATISTIQUES');
        $sheet->mergeCells('A' . $row . ':D' . $row);
        $this->styleHeader($sheet, 'A' . $row . ':D' . $row, 12);
        
        $row++;
        $sheet->setCellValue('A' . $row, 'Employés actifs');
        $sheet->setCellValue('B' . $row, $summary['active_employees']);
        
        $row++;
        $sheet->setCellValue('A' . $row, 'Restaurants partenaires');
        $sheet->setCellValue('B' . $row, $summary['restaurants_count']);
        
        $row++;
        $sheet->setCellValue('A' . $row, 'Commandes validées');
        $sheet->setCellValue('B' . $row, $summary['orders_count']);
        
        $row++;
        $sheet->setCellValue('A' . $row, 'Montant moyen par commande');
        $sheet->setCellValue('B' . $row, $summary['average_order_amount']);
        $this->styleAmount($sheet, 'B' . $row);
        
        // Ajuster largeurs
        $sheet->getColumnDimension('A')->setWidth(30);
        $sheet->getColumnDimension('B')->setWidth(15);
        $sheet->getColumnDimension('C')->setWidth(20);
        $sheet->getColumnDimension('D')->setWidth(15);
        
        // Bordures
        $this->styleBorders($sheet, 'A7:D' . ($row));
    }
    
    /**
     * Onglet 2: Par Employé
     */
    private function createEmployeeSheet($employees)
    {
        $sheet = $this->spreadsheet->createSheet();
        $sheet->setTitle('Par Employé');
        
        // En-têtes
        $headers = [
            'A1' => 'N° Employé',
            'B1' => 'Nom Complet',
            'C1' => 'Email',
            'D1' => 'Service',
            'E1' => 'Tickets Affectés',
            'F1' => 'Tickets Consommés',
            'G1' => 'Tickets Restants',
            'H1' => 'Montant Affecté (F CFA)',
            'I1' => 'Montant Consommé (F CFA)',
            'J1' => 'Solde Actuel (F CFA)',
            'K1' => 'Taux Utilisation (%)'
        ];
        
        foreach ($headers as $cell => $value) {
            $sheet->setCellValue($cell, $value);
        }
        $this->styleHeader($sheet, 'A1:K1', 11);
        
        // Données
        $row = 2;
        foreach ($employees as $emp) {
            $sheet->setCellValue('A' . $row, $emp['employee_id'] ?? '-');
            $sheet->setCellValue('B' . $row, $emp['name']);
            $sheet->setCellValue('C' . $row, $emp['email']);
            $sheet->setCellValue('D' . $row, $emp['department'] ?? 'N/A');
            $sheet->setCellValue('E' . $row, $emp['tickets_assigned']);
            $sheet->setCellValue('F' . $row, $emp['tickets_used']);
            $sheet->setCellValue('G' . $row, $emp['tickets_remaining']);
            $sheet->setCellValue('H' . $row, $emp['amount_assigned']);
            $sheet->setCellValue('I' . $row, $emp['amount_used']);
            $sheet->setCellValue('J' . $row, $emp['balance']);
            $sheet->setCellValue('K' . $row, $emp['usage_rate']);
            
            // Formatage
            $this->styleAmount($sheet, 'H' . $row);
            $this->styleAmount($sheet, 'I' . $row);
            $this->styleAmount($sheet, 'J' . $row);
            $this->stylePercent($sheet, 'K' . $row);
            
            // Alternance couleurs
            if ($row % 2 == 0) {
                $this->styleAlternateRow($sheet, 'A' . $row . ':K' . $row);
            }
            
            $row++;
        }
        
        // Total
        if (count($employees) > 0) {
            $sheet->setCellValue('A' . $row, 'TOTAL');
            $sheet->setCellValue('E' . $row, '=SUM(E2:E' . ($row - 1) . ')');
            $sheet->setCellValue('F' . $row, '=SUM(F2:F' . ($row - 1) . ')');
            $sheet->setCellValue('G' . $row, '=SUM(G2:G' . ($row - 1) . ')');
            $sheet->setCellValue('H' . $row, '=SUM(H2:H' . ($row - 1) . ')');
            $sheet->setCellValue('I' . $row, '=SUM(I2:I' . ($row - 1) . ')');
            $sheet->setCellValue('J' . $row, '=SUM(J2:J' . ($row - 1) . ')');
            
            $this->styleBold($sheet, 'A' . $row . ':K' . $row);
            $this->styleAmount($sheet, 'H' . $row);
            $this->styleAmount($sheet, 'I' . $row);
            $this->styleAmount($sheet, 'J' . $row);
        }
        
        // Bordures et largeurs
        $this->styleBorders($sheet, 'A1:K' . $row);
        $this->autoSizeColumns($sheet, 'A', 'K');
        
        // Activer les filtres
        $sheet->setAutoFilter('A1:K1');
    }
    
    /**
     * Onglet 3: Par Restaurant
     */
    private function createRestaurantSheet($restaurants)
    {
        $sheet = $this->spreadsheet->createSheet();
        $sheet->setTitle('Par Restaurant');
        
        // En-têtes
        $headers = [
            'A1' => 'Restaurant',
            'B1' => 'Adresse',
            'C1' => 'Téléphone',
            'D1' => 'Nb Commandes',
            'E1' => 'Montant Total (F CFA)',
            'F1' => 'Ticket Moyen (F CFA)',
            'G1' => '% Total Dépenses'
        ];
        
        foreach ($headers as $cell => $value) {
            $sheet->setCellValue($cell, $value);
        }
        $this->styleHeader($sheet, 'A1:G1', 11);
        
        // Données
        $row = 2;
        foreach ($restaurants as $rest) {
            $sheet->setCellValue('A' . $row, $rest['name']);
            $sheet->setCellValue('B' . $row, $rest['address'] ?? 'N/A');
            $sheet->setCellValue('C' . $row, $rest['phone'] ?? 'N/A');
            $sheet->setCellValue('D' . $row, $rest['orders_count']);
            $sheet->setCellValue('E' . $row, $rest['total_amount']);
            $sheet->setCellValue('F' . $row, $rest['average_order']);
            $sheet->setCellValue('G' . $row, $rest['percentage']);
            
            $this->styleAmount($sheet, 'E' . $row);
            $this->styleAmount($sheet, 'F' . $row);
            $this->stylePercent($sheet, 'G' . $row);
            
            if ($row % 2 == 0) {
                $this->styleAlternateRow($sheet, 'A' . $row . ':G' . $row);
            }
            
            $row++;
        }
        
        // Total
        if (count($restaurants) > 0) {
            $sheet->setCellValue('A' . $row, 'TOTAL');
            $sheet->setCellValue('D' . $row, '=SUM(D2:D' . ($row - 1) . ')');
            $sheet->setCellValue('E' . $row, '=SUM(E2:E' . ($row - 1) . ')');
            $sheet->setCellValue('G' . $row, '=SUM(G2:G' . ($row - 1) . ')');
            
            $this->styleBold($sheet, 'A' . $row . ':G' . $row);
            $this->styleAmount($sheet, 'E' . $row);
            $this->stylePercent($sheet, 'G' . $row);
        }
        
        $this->styleBorders($sheet, 'A1:G' . $row);
        $this->autoSizeColumns($sheet, 'A', 'G');
        $sheet->setAutoFilter('A1:G1');
    }
    
    /**
     * Onglet 4: Par Date
     */
    private function createDateSheet($dates)
    {
        $sheet = $this->spreadsheet->createSheet();
        $sheet->setTitle('Par Date');
        
        // En-têtes
        $headers = [
            'A1' => 'Date',
            'B1' => 'Type',
            'C1' => 'Employé',
            'D1' => 'Restaurant',
            'E1' => 'Nb Tickets',
            'F1' => 'Montant (F CFA)',
            'G1' => 'Cumul Affecté',
            'H1' => 'Cumul Consommé'
        ];
        
        foreach ($headers as $cell => $value) {
            $sheet->setCellValue($cell, $value);
        }
        $this->styleHeader($sheet, 'A1:H1', 11);
        
        // Données
        $row = 2;
        $cumulAssigned = 0;
        $cumulUsed = 0;
        
        foreach ($dates as $entry) {
            $sheet->setCellValue('A' . $row, $entry['date']);
            $sheet->setCellValue('B' . $row, $entry['type']);
            $sheet->setCellValue('C' . $row, $entry['employee']);
            $sheet->setCellValue('D' . $row, $entry['restaurant'] ?? '-');
            $sheet->setCellValue('E' . $row, $entry['tickets_count']);
            $sheet->setCellValue('F' . $row, $entry['amount']);
            
            if ($entry['type'] === 'Affectation') {
                $cumulAssigned += $entry['amount'];
            } else {
                $cumulUsed += $entry['amount'];
            }
            
            $sheet->setCellValue('G' . $row, $cumulAssigned);
            $sheet->setCellValue('H' . $row, $cumulUsed);
            
            $this->styleAmount($sheet, 'F' . $row);
            $this->styleAmount($sheet, 'G' . $row);
            $this->styleAmount($sheet, 'H' . $row);
            
            if ($row % 2 == 0) {
                $this->styleAlternateRow($sheet, 'A' . $row . ':H' . $row);
            }
            
            $row++;
        }
        
        $this->styleBorders($sheet, 'A1:H' . ($row - 1));
        $this->autoSizeColumns($sheet, 'A', 'H');
        $sheet->setAutoFilter('A1:H1');
    }
    
    /**
     * Onglet 5: Réconciliation
     */
    private function createReconciliationSheet($reconciliation)
    {
        $sheet = $this->spreadsheet->createSheet();
        $sheet->setTitle('Réconciliation');
        
        // En-têtes
        $headers = [
            'A1' => 'Date',
            'B1' => 'Affectations (nb)',
            'C1' => 'Affectations (montant)',
            'D1' => 'Consommations (nb)',
            'E1' => 'Consommations (montant)',
            'F1' => 'Écart (nb)',
            'G1' => 'Écart (montant)',
            'H1' => 'Cumul Mois Affecté',
            'I1' => 'Cumul Mois Consommé'
        ];
        
        foreach ($headers as $cell => $value) {
            $sheet->setCellValue($cell, $value);
        }
        $this->styleHeader($sheet, 'A1:I1', 11);
        
        // Données
        $row = 2;
        foreach ($reconciliation as $entry) {
            $sheet->setCellValue('A' . $row, $entry['date']);
            $sheet->setCellValue('B' . $row, $entry['assigned_count']);
            $sheet->setCellValue('C' . $row, $entry['assigned_amount']);
            $sheet->setCellValue('D' . $row, $entry['used_count']);
            $sheet->setCellValue('E' . $row, $entry['used_amount']);
            $sheet->setCellValue('F' . $row, $entry['gap_count']);
            $sheet->setCellValue('G' . $row, $entry['gap_amount']);
            $sheet->setCellValue('H' . $row, $entry['cumul_assigned']);
            $sheet->setCellValue('I' . $row, $entry['cumul_used']);
            
            $this->styleAmount($sheet, 'C' . $row);
            $this->styleAmount($sheet, 'E' . $row);
            $this->styleAmount($sheet, 'G' . $row);
            $this->styleAmount($sheet, 'H' . $row);
            $this->styleAmount($sheet, 'I' . $row);
            
            // Colorer les écarts négatifs en rouge
            if ($entry['gap_amount'] < 0) {
                $sheet->getStyle('F' . $row . ':G' . $row)->getFont()->getColor()->setARGB('FFFF0000');
            }
            
            if ($row % 2 == 0) {
                $this->styleAlternateRow($sheet, 'A' . $row . ':I' . $row);
            }
            
            $row++;
        }
        
        // Total
        if (count($reconciliation) > 0) {
            $sheet->setCellValue('A' . $row, 'TOTAL');
            $sheet->setCellValue('B' . $row, '=SUM(B2:B' . ($row - 1) . ')');
            $sheet->setCellValue('C' . $row, '=SUM(C2:C' . ($row - 1) . ')');
            $sheet->setCellValue('D' . $row, '=SUM(D2:D' . ($row - 1) . ')');
            $sheet->setCellValue('E' . $row, '=SUM(E2:E' . ($row - 1) . ')');
            $sheet->setCellValue('F' . $row, '=B' . $row . '-D' . $row);
            $sheet->setCellValue('G' . $row, '=C' . $row . '-E' . $row);
            
            $this->styleBold($sheet, 'A' . $row . ':I' . $row);
            $this->styleAmount($sheet, 'C' . $row);
            $this->styleAmount($sheet, 'E' . $row);
            $this->styleAmount($sheet, 'G' . $row);
        }
        
        $this->styleBorders($sheet, 'A1:I' . $row);
        $this->autoSizeColumns($sheet, 'A', 'I');
        $sheet->setAutoFilter('A1:I1');
    }
    
    /**
     * Sauvegarde le fichier et retourne le chemin
     */
    public function save($filename)
    {
        $writer = new Xlsx($this->spreadsheet);
        $filepath = storage_path('app/public/reports/' . $filename);
        
        // Créer le dossier si nécessaire
        if (!file_exists(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }
        
        $writer->save($filepath);
        return $filepath;
    }
    
    /**
     * Télécharge directement le fichier
     */
    public function download($filename)
    {
        $writer = new Xlsx($this->spreadsheet);
        
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');
        
        $writer->save('php://output');
    }
    
    // ============ Méthodes de style ============
    
    private function styleHeader($sheet, $range, $fontSize = 11, $isCentered = false)
    {
        $style = $sheet->getStyle($range);
        $style->getFont()->setBold(true)->setSize($fontSize);
        $style->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFFF9800');
        $style->getFont()->getColor()->setARGB('FFFFFFFF');
        
        if ($isCentered) {
            $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }
    }
    
    private function styleBold($sheet, $range)
    {
        $sheet->getStyle($range)->getFont()->setBold(true);
    }
    
    private function styleAmount($sheet, $cell)
    {
        $sheet->getStyle($cell)->getNumberFormat()->setFormatCode('#,##0 "F CFA"');
    }
    
    private function stylePercent($sheet, $cell)
    {
        $sheet->getStyle($cell)->getNumberFormat()->setFormatCode('0.00"%"');
    }
    
    private function styleBorders($sheet, $range)
    {
        $sheet->getStyle($range)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
    }
    
    private function styleAlternateRow($sheet, $range)
    {
        $sheet->getStyle($range)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF5F5F5');
    }
    
    private function autoSizeColumns($sheet, $startCol, $endCol)
    {
        for ($col = $startCol; $col <= $endCol; $col++) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }
    
    private function getMonthName($month)
    {
        $months = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'
        ];
        
        return $months[$month] ?? 'Mois ' . $month;
    }
}
