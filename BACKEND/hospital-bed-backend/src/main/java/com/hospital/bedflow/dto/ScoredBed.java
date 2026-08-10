package com.hospital.bedflow.dto;

import com.hospital.bedflow.model.Bed;

public class ScoredBed {
    private Bed bed;
    private int total;
    private int specialty;
    private int acuityFit;
    private int loadBalance;
    private int bonus;

    public ScoredBed() {}

    public ScoredBed(Bed bed, int total, int specialty, int acuityFit, int loadBalance, int bonus) {
        this.bed = bed;
        this.total = total;
        this.specialty = specialty;
        this.acuityFit = acuityFit;
        this.loadBalance = loadBalance;
        this.bonus = bonus;
    }

    public Bed getBed() { return bed; }
    public void setBed(Bed bed) { this.bed = bed; }

    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }

    public int getSpecialty() { return specialty; }
    public void setSpecialty(int specialty) { this.specialty = specialty; }

    public int getAcuityFit() { return acuityFit; }
    public void setAcuityFit(int acuityFit) { this.acuityFit = acuityFit; }

    public int getLoadBalance() { return loadBalance; }
    public void setLoadBalance(int loadBalance) { this.loadBalance = loadBalance; }

    public int getBonus() { return bonus; }
    public void setBonus(int bonus) { this.bonus = bonus; }
}